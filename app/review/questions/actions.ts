"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type QuestionStatus = Database["public"]["Tables"]["questions"]["Row"]["status"];
type ReviewEventType =
  Database["public"]["Tables"]["question_review_events"]["Row"]["event_type"];

type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireReviewerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as CurrentProfile | null;

  if (!profile || profile.status !== "active") {
    redirect("/auth/login");
  }

  if (
    profile.role !== "admin" &&
    profile.role !== "teacher" &&
    profile.role !== "support_teacher"
  ) {
    redirect("/dashboard");
  }

  return profile;
}

async function canReviewQuestion(questionId: string, profile: CurrentProfile) {
  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select("id, created_by_user_id, source_group_id, status")
    .eq("id", questionId)
    .maybeSingle();

  if (!question) {
    return { question: null, error: "Savol topilmadi." };
  }

  if (question.status !== "pending_review") {
    return { question, error: "Bu savol review queue'da emas." };
  }

  if (profile.role === "admin") {
    return { question, error: "" };
  }

  if (!question.source_group_id) {
    return { question, error: "Savol groupga bog'lanmagan." };
  }

  if (profile.role === "teacher") {
    const { data: group } = await admin
      .from("groups")
      .select("id, teacher_id")
      .eq("id", question.source_group_id)
      .maybeSingle();

    if (group?.teacher_id === profile.id) {
      return { question, error: "" };
    }
  }

  if (profile.role === "support_teacher") {
    if (question.created_by_user_id === profile.id) {
      return { question, error: "Support teacher o'z savolini review qila olmaydi." };
    }

    const { data: member } = await admin
      .from("group_members")
      .select("id, status")
      .eq("group_id", question.source_group_id)
      .eq("user_id", profile.id)
      .eq("role", "support_teacher")
      .maybeSingle();

    if (member?.status === "active") {
      return { question, error: "" };
    }
  }

  return { question, error: "Bu savolni review qilish huquqi yo'q." };
}

async function applyReview({
  comment,
  eventType,
  questionId,
  status,
}: {
  comment: string | null;
  eventType: ReviewEventType;
  questionId: string;
  status: QuestionStatus;
}) {
  const profile = await requireReviewerProfile();
  const { question, error: permissionError } = await canReviewQuestion(questionId, profile);

  if (!question) {
    return actionError(permissionError);
  }

  if (permissionError) {
    return actionError(permissionError);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("questions")
    .update({
      status,
      approved_by_user_id: status === "approved" ? profile.id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", question.id);

  if (error) {
    return actionError(error.message);
  }

  const { error: eventError } = await admin.from("question_review_events").insert({
    question_id: question.id,
    actor_id: profile.id,
    event_type: eventType,
    comment,
    visibility: eventType === "approved" ? "internal" : "student_visible",
  });

  if (eventError) {
    return actionError(eventError.message);
  }

  revalidatePath("/review/questions");
  revalidatePath("/question-bank");
  revalidatePath("/assignments");
  return actionSuccess("Review saqlandi.");
}

export async function approveQuestionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = getFormString(formData, "question_id");
  const comment = getFormString(formData, "comment") || null;

  if (!questionId) {
    return actionError("Savol topilmadi.");
  }

  return applyReview({
    comment,
    eventType: "approved",
    questionId,
    status: "approved",
  });
}

export async function requestQuestionChangesAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = getFormString(formData, "question_id");
  const comment = getFormString(formData, "comment");

  if (!questionId) {
    return actionError("Savol topilmadi.");
  }

  if (!comment) {
    return actionError("Needs changes uchun comment majburiy.");
  }

  return applyReview({
    comment,
    eventType: "needs_changes",
    questionId,
    status: "needs_changes",
  });
}

export async function rejectQuestionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = getFormString(formData, "question_id");
  const comment = getFormString(formData, "comment");

  if (!questionId) {
    return actionError("Savol topilmadi.");
  }

  if (!comment) {
    return actionError("Reject uchun comment majburiy.");
  }

  return applyReview({
    comment,
    eventType: "rejected",
    questionId,
    status: "rejected",
  });
}
