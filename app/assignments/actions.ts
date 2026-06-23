"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type AssignmentStatus =
  Database["public"]["Tables"]["question_assignments"]["Row"]["status"];
type AnswerType = Database["public"]["Tables"]["questions"]["Row"]["answer_type"];
type QuestionStatus = Database["public"]["Tables"]["questions"]["Row"]["status"];

type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

const ASSIGNMENT_STATUSES = new Set<AssignmentStatus>([
  "open",
  "reviewing",
  "ready",
  "used",
  "archived",
]);

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTextAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

async function cleanupQuestion(questionId: string) {
  const admin = createAdminClient();
  await admin.from("questions").delete().eq("id", questionId);
}

async function requireActiveProfile() {
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

  return profile;
}

async function canCreateForGroup(groupId: string, profile: CurrentProfile) {
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

  if (profile.role === "support_teacher") {
    const { data: member } = await admin
      .from("group_members")
      .select("id, role, status")
      .eq("group_id", groupId)
      .eq("user_id", profile.id)
      .eq("role", "support_teacher")
      .maybeSingle();

    return member?.status === "active";
  }

  return false;
}

async function canSubmitForAssignment(assignmentId: string, profile: CurrentProfile) {
  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("question_assignments")
    .select(
      "id, group_id, level_id, category_id, deadline_at, share_approved_to_public_bank, status",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) {
    return { assignment: null, error: "Assignment topilmadi." };
  }

  if (profile.role !== "student") {
    return { assignment, error: "Savol submit qilish uchun student account kerak." };
  }

  if (assignment.status !== "open") {
    return { assignment, error: "Bu assignment hozir savol qabul qilmaydi." };
  }

  if (assignment.deadline_at && new Date(assignment.deadline_at).getTime() < Date.now()) {
    return { assignment, error: "Deadline o'tgan. Submit yopilgan." };
  }

  const { data: member } = await admin
    .from("group_members")
    .select("id, status")
    .eq("group_id", assignment.group_id)
    .eq("user_id", profile.id)
    .eq("role", "student")
    .maybeSingle();

  if (member?.status !== "active") {
    return { assignment, error: "Bu assignment groupiga a'zo emassiz." };
  }

  return { assignment, error: "" };
}

function parseDeadline(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export async function createAssignmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const groupId = getFormString(formData, "group_id");
  const title = getFormString(formData, "title");
  const topic = getFormString(formData, "topic");
  const levelId = getFormString(formData, "level_id") || null;
  const categoryId = getFormString(formData, "category_id") || null;
  const questionsPerStudent = Number(getFormString(formData, "questions_per_student"));
  const deadline = parseDeadline(getFormString(formData, "deadline_at"));
  const shareApprovedToPublicBank = getFormString(formData, "share_public") === "true";

  if (!groupId || !title || !topic) {
    return actionError("Group, title va topic kiriting.");
  }

  if (!Number.isInteger(questionsPerStudent) || questionsPerStudent < 1) {
    return actionError("Har student uchun savollar soni 1 yoki undan katta bo'lishi kerak.");
  }

  if (deadline === undefined) {
    return actionError("Deadline formati noto'g'ri.");
  }

  if (!(await canCreateForGroup(groupId, profile))) {
    return actionError("Bu group uchun assignment yaratish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("question_assignments").insert({
    group_id: groupId,
    created_by_user_id: profile.id,
    title,
    topic,
    level_id: levelId,
    category_id: categoryId,
    questions_per_student: questionsPerStudent,
    deadline_at: deadline,
    share_approved_to_public_bank: shareApprovedToPublicBank,
    status: "open",
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/assignments");
  return actionSuccess("Assignment yaratildi.");
}

export async function updateAssignmentStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const assignmentId = getFormString(formData, "assignment_id");
  const status = getFormString(formData, "status") as AssignmentStatus;

  if (!assignmentId || !ASSIGNMENT_STATUSES.has(status)) {
    return actionError("Assignment status form noto'g'ri.");
  }

  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("question_assignments")
    .select("id, group_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) {
    return actionError("Assignment topilmadi.");
  }

  if (!(await canCreateForGroup(assignment.group_id, profile))) {
    return actionError("Bu assignmentni o'zgartirish huquqi yo'q.");
  }

  const { error } = await admin
    .from("question_assignments")
    .update({ status })
    .eq("id", assignmentId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/assignments");
  return actionSuccess("Assignment status yangilandi.");
}

export async function createQuestionForAssignmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const assignmentId = getFormString(formData, "assignment_id");
  const intent = getFormString(formData, "intent");
  const answerType = getFormString(formData, "answer_type") as AnswerType;
  const prompt = getFormString(formData, "prompt");
  const explanation = getFormString(formData, "explanation") || null;
  const tags = parseTags(getFormString(formData, "tags"));
  const status: QuestionStatus = intent === "submit" ? "pending_review" : "draft";

  if (!assignmentId) {
    return actionError("Assignment topilmadi.");
  }

  if (answerType !== "single_choice" && answerType !== "text") {
    return actionError("Question type noto'g'ri.");
  }

  if (!prompt) {
    return actionError("Savol matnini kiriting.");
  }

  const { assignment, error: permissionError } = await canSubmitForAssignment(assignmentId, profile);

  if (!assignment) {
    return actionError(permissionError);
  }

  if (permissionError) {
    return actionError(permissionError);
  }

  const optionValues =
    answerType === "single_choice"
      ? [0, 1, 2, 3].map((index) => getFormString(formData, `option_${index}`))
      : [];
  const correctIndex = Number(getFormString(formData, "correct_option"));
  const normalizedAnswers =
    answerType === "text"
      ? Array.from(
          new Set(
            [getFormString(formData, "text_answer")]
              .concat(getFormString(formData, "text_answer_alt").split(","))
              .map((answer) => answer.trim())
              .filter(Boolean)
              .map(normalizeTextAnswer),
          ),
        )
      : [];

  if (answerType === "single_choice") {
    if (optionValues.some((option) => !option)) {
      return actionError("Barcha variantlarni kiriting.");
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return actionError("To'g'ri variantni tanlang.");
    }
  }

  if (answerType === "text" && normalizedAnswers.length === 0) {
    return actionError("Kamida bitta to'g'ri text answer kiriting.");
  }

  const admin = createAdminClient();
  const { data: question, error: questionError } = await admin
    .from("questions")
    .insert({
      created_by_user_id: profile.id,
      source_assignment_id: assignment.id,
      source_group_id: assignment.group_id,
      level_id: assignment.level_id,
      category_id: assignment.category_id,
      answer_type: answerType,
      prompt,
      explanation,
      visibility: assignment.share_approved_to_public_bank ? "public" : "group_only",
      status,
    })
    .select("id")
    .single();

  if (questionError || !question?.id) {
    return actionError(questionError?.message ?? "Savol saqlanmadi.");
  }

  if (answerType === "single_choice") {
    const { error: optionsError } = await admin.from("question_options").insert(
      optionValues.map((text, index) => ({
        question_id: question.id,
        text,
        is_correct: index === correctIndex,
        order_index: index,
      })),
    );

    if (optionsError) {
      await cleanupQuestion(question.id);
      return actionError(optionsError.message);
    }
  } else {
    const { error: answersError } = await admin.from("question_text_answers").insert(
      normalizedAnswers.map((normalizedAnswer) => ({
        question_id: question.id,
        answer_text: normalizedAnswer,
        normalized_answer: normalizedAnswer,
      })),
    );

    if (answersError) {
      await cleanupQuestion(question.id);
      return actionError(answersError.message);
    }
  }

  if (tags.length > 0) {
    const { error: tagsError } = await admin.from("question_tags").insert(
      tags.map((tag) => ({
        question_id: question.id,
        tag,
      })),
    );

    if (tagsError) {
      await cleanupQuestion(question.id);
      return actionError(tagsError.message);
    }
  }

  if (status === "pending_review") {
    await admin.from("question_review_events").insert({
      question_id: question.id,
      actor_id: profile.id,
      event_type: "submitted",
      comment: "Student savolni reviewga yubordi.",
    });
  }

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignment.id}`);
  return actionSuccess(status === "draft" ? "Draft saqlandi." : "Savol reviewga yuborildi.");
}

export async function submitDraftQuestionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const questionId = getFormString(formData, "question_id");
  const assignmentId = getFormString(formData, "assignment_id");

  if (!questionId || !assignmentId) {
    return actionError("Draft topilmadi.");
  }

  const { assignment, error: permissionError } = await canSubmitForAssignment(assignmentId, profile);

  if (!assignment) {
    return actionError(permissionError);
  }

  if (permissionError) {
    return actionError(permissionError);
  }

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select("id, created_by_user_id, source_assignment_id, status")
    .eq("id", questionId)
    .maybeSingle();

  if (
    !question ||
    question.created_by_user_id !== profile.id ||
    question.source_assignment_id !== assignment.id ||
    question.status !== "draft"
  ) {
    return actionError("Faqat o'zingizning draft savolingizni submit qila olasiz.");
  }

  const { error } = await admin
    .from("questions")
    .update({ status: "pending_review" })
    .eq("id", questionId);

  if (error) {
    return actionError(error.message);
  }

  await admin.from("question_review_events").insert({
    question_id: questionId,
    actor_id: profile.id,
    event_type: "submitted",
    comment: "Student draft savolni reviewga yubordi.",
  });

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignment.id}`);
  return actionSuccess("Draft reviewga yuborildi.");
}
