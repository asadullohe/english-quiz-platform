"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type FeedbackMode = Database["public"]["Tables"]["quiz_templates"]["Row"]["feedback_mode"];
type TemplateStatus = Database["public"]["Tables"]["quiz_templates"]["Row"]["status"];

type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

const FEEDBACK_MODES = new Set<FeedbackMode>(["instant", "after_finish"]);
const TEMPLATE_STATUSES = new Set<TemplateStatus>(["draft", "active", "archived"]);

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireBuilderProfile() {
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

async function canBuildForGroup(groupId: string, profile: CurrentProfile) {
  if (profile.role === "admin") {
    return true;
  }

  const admin = createAdminClient();

  if (profile.role === "teacher") {
    const { data: group } = await admin
      .from("groups")
      .select("id, teacher_id, status")
      .eq("id", groupId)
      .maybeSingle();

    return group?.status === "active" && group.teacher_id === profile.id;
  }

  const { data: member } = await admin
    .from("group_members")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", profile.id)
    .eq("role", "support_teacher")
    .maybeSingle();

  return member?.status === "active";
}

async function canUseQuestions(questionIds: string[], groupId: string, profile: CurrentProfile) {
  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("questions")
    .select("id, status, visibility, source_group_id")
    .in("id", questionIds);
  const rows = questions ?? [];

  if (rows.length !== questionIds.length) {
    return false;
  }

  return rows.every((question) => {
    if (question.status !== "approved") {
      return false;
    }

    if (profile.role === "admin" || question.visibility === "public") {
      return true;
    }

    return question.source_group_id === groupId;
  });
}

export async function createQuizTemplateAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireBuilderProfile();
  const groupId = getFormString(formData, "group_id");
  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description") || null;
  const levelId = getFormString(formData, "level_id") || null;
  const categoryId = getFormString(formData, "category_id") || null;
  const questionCount = Number(getFormString(formData, "question_count_per_participant"));
  const durationMinutes = Number(getFormString(formData, "duration_minutes"));
  const feedbackMode = getFormString(formData, "feedback_mode") as FeedbackMode;
  const status = getFormString(formData, "status") as TemplateStatus;
  const allowGuests = getFormString(formData, "allow_guests") === "true";
  const showCorrectAnswers = getFormString(formData, "show_correct_answers") === "true";
  const questionIds = formData
    .getAll("question_id")
    .filter((value): value is string => typeof value === "string" && Boolean(value));

  if (!groupId || !title) {
    return actionError("Group va quiz title kiriting.");
  }

  if (!Number.isInteger(questionCount) || questionCount < 1) {
    return actionError("Question count 1 yoki undan katta bo'lishi kerak.");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
    return actionError("Duration 1 daqiqa yoki undan katta bo'lishi kerak.");
  }

  if (!FEEDBACK_MODES.has(feedbackMode) || !TEMPLATE_STATUSES.has(status)) {
    return actionError("Quiz settings noto'g'ri.");
  }

  if (questionIds.length === 0) {
    return actionError("Kamida bitta approved savol tanlang.");
  }

  if (questionCount > questionIds.length) {
    return actionError("Participant question count tanlangan savollardan ko'p bo'lmasin.");
  }

  if (!(await canBuildForGroup(groupId, profile))) {
    return actionError("Bu group uchun quiz yaratish huquqi yo'q.");
  }

  if (!(await canUseQuestions(questionIds, groupId, profile))) {
    return actionError("Tanlangan savollardan foydalanish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { data: template, error: templateError } = await admin
    .from("quiz_templates")
    .insert({
      created_by_user_id: profile.id,
      group_id: groupId,
      title,
      description,
      level_id: levelId,
      category_id: categoryId,
      question_count_per_participant: questionCount,
      duration_minutes: durationMinutes,
      feedback_mode: feedbackMode,
      show_correct_answers_after_finish: showCorrectAnswers,
      allow_guests: allowGuests,
      status,
    })
    .select("id")
    .single();

  if (templateError || !template?.id) {
    return actionError(templateError?.message ?? "Quiz template yaratilmadi.");
  }

  const { error: questionsError } = await admin.from("quiz_template_questions").insert(
    questionIds.map((questionId, index) => ({
      quiz_template_id: template.id,
      question_id: questionId,
      order_index: index,
    })),
  );

  if (questionsError) {
    await admin.from("quiz_templates").delete().eq("id", template.id);
    return actionError(questionsError.message);
  }

  revalidatePath("/quizzes");
  return actionSuccess("Quiz template yaratildi.");
}
