"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

type TemplateRow = Database["public"]["Tables"]["quiz_templates"]["Row"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  | "id"
  | "created_by_user_id"
  | "points"
  | "prompt"
  | "explanation"
  | "answer_type"
  | "image_asset_id"
  | "audio_asset_id"
>;
type OptionRow = Database["public"]["Tables"]["question_options"]["Row"];
type TextAnswerRow = Database["public"]["Tables"]["question_text_answers"]["Row"];

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function makeJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function requireSessionManager() {
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

async function canManageGroup(groupId: string | null, profile: CurrentProfile) {
  if (profile.role === "admin") {
    return true;
  }

  if (!groupId) {
    return false;
  }

  const admin = createAdminClient();

  if (profile.role === "teacher") {
    const { data: group } = await admin
      .from("groups")
      .select("id, teacher_id")
      .eq("id", groupId)
      .maybeSingle();

    return group?.teacher_id === profile.id;
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

async function canManageSession(sessionId: string, profile: CurrentProfile) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("live_sessions")
    .select("id, group_id, created_by_user_id, status, duration_minutes")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return { session: null, error: "Session topilmadi." };
  }

  if (profile.role === "admin" || session.created_by_user_id === profile.id) {
    return { session, error: "" };
  }

  if (await canManageGroup(session.group_id, profile)) {
    return { session, error: "" };
  }

  return { session, error: "Bu sessionni boshqarish huquqi yo'q." };
}

async function getSnapshotRows(templateId: string, sessionId: string) {
  const admin = createAdminClient();
  const { data: templateQuestions } = await admin
    .from("quiz_template_questions")
    .select("question_id, order_index")
    .eq("quiz_template_id", templateId)
    .order("order_index", { ascending: true });
  const questionIds = (templateQuestions ?? []).map((item) => item.question_id);

  if (questionIds.length === 0) {
    return [];
  }

  const [questionsResult, optionsResult, answersResult] = await Promise.all([
    admin
      .from("questions")
      .select(
        "id, created_by_user_id, points, prompt, explanation, answer_type, image_asset_id, audio_asset_id",
      )
      .in("id", questionIds),
    admin
      .from("question_options")
      .select("id, question_id, text, is_correct, order_index")
      .in("question_id", questionIds),
    admin
      .from("question_text_answers")
      .select("id, question_id, answer_text, normalized_answer")
      .in("question_id", questionIds),
  ]);
  const questionsById = new Map(
    ((questionsResult.data ?? []) as QuestionRow[]).map((question) => [question.id, question]),
  );
  const options = (optionsResult.data ?? []) as OptionRow[];
  const answers = (answersResult.data ?? []) as TextAnswerRow[];

  return questionIds.flatMap((questionId) => {
    const question = questionsById.get(questionId);

    if (!question) {
      return [];
    }

    const optionsSnapshot =
      question.answer_type === "single_choice"
        ? (options
            .filter((option) => option.question_id === question.id)
            .sort((left, right) => left.order_index - right.order_index)
            .map((option) => ({
              text: option.text,
              is_correct: option.is_correct,
              order_index: option.order_index,
            })) as Json)
        : null;
    const acceptedAnswersSnapshot =
      question.answer_type === "text"
        ? (answers
            .filter((answer) => answer.question_id === question.id)
            .map((answer) => ({
              answer_text: answer.answer_text,
              normalized_answer: answer.normalized_answer,
            })) as Json)
        : null;

    return [
      {
        session_id: sessionId,
        original_question_id: question.id,
        created_by_user_id_snapshot: question.created_by_user_id,
        points_snapshot: question.points,
        prompt_snapshot: question.prompt,
        explanation_snapshot: question.explanation,
        answer_type_snapshot: question.answer_type,
        options_snapshot: optionsSnapshot,
        accepted_answers_snapshot: acceptedAnswersSnapshot,
        image_asset_id_snapshot: question.image_asset_id,
        audio_asset_id_snapshot: question.audio_asset_id,
      },
    ];
  });
}

export async function createLiveSessionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireSessionManager();
  const templateId = getFormString(formData, "template_id");

  if (!templateId) {
    return actionError("Quiz template tanlang.");
  }

  const admin = createAdminClient();
  const { data: templateData } = await admin
    .from("quiz_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  const template = templateData as TemplateRow | null;

  if (!template || template.status !== "active") {
    return actionError("Active quiz template tanlang.");
  }

  if (!(await canManageGroup(template.group_id, profile))) {
    return actionError("Bu template uchun session yaratish huquqi yo'q.");
  }

  let sessionId = "";
  let insertError: { message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from("live_sessions")
      .insert({
        quiz_template_id: template.id,
        group_id: template.group_id,
        created_by_user_id: profile.id,
        join_code: makeJoinCode(),
        title_snapshot: template.title,
        description_snapshot: template.description,
        cover_image_asset_id_snapshot: template.cover_image_asset_id,
        duration_minutes: template.duration_minutes,
        question_count_per_participant: template.question_count_per_participant,
        feedback_mode: template.feedback_mode,
        show_correct_answers_after_finish: template.show_correct_answers_after_finish,
        allow_guests: template.allow_guests,
        status: "waiting",
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      sessionId = data.id;
      insertError = null;
      break;
    }

    insertError = error;
  }

  if (insertError || !sessionId) {
    return actionError(insertError?.message ?? "Session yaratilmadi.");
  }

  const snapshotRows = await getSnapshotRows(template.id, sessionId);

  if (snapshotRows.length === 0) {
    await admin.from("live_sessions").delete().eq("id", sessionId);
    return actionError("Template ichida savollar topilmadi.");
  }

  const { error: poolError } = await admin.from("session_question_pool").insert(snapshotRows);

  if (poolError) {
    await admin.from("live_sessions").delete().eq("id", sessionId);
    return actionError(poolError.message);
  }

  revalidatePath("/sessions");
  return actionSuccess("Live session yaratildi.");
}

export async function startLiveSessionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireSessionManager();
  const sessionId = getFormString(formData, "session_id");

  if (!sessionId) {
    return actionError("Session topilmadi.");
  }

  const { session, error: permissionError } = await canManageSession(sessionId, profile);

  if (!session) {
    return actionError(permissionError);
  }

  if (permissionError) {
    return actionError(permissionError);
  }

  if (session.status !== "waiting") {
    return actionError("Faqat waiting session start qilinadi.");
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + session.duration_minutes * 60_000);
  const admin = createAdminClient();
  const { error } = await admin
    .from("live_sessions")
    .update({
      status: "live",
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq("id", session.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/sessions");
  return actionSuccess("Session start qilindi.");
}

export async function endLiveSessionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireSessionManager();
  const sessionId = getFormString(formData, "session_id");

  if (!sessionId) {
    return actionError("Session topilmadi.");
  }

  const { session, error: permissionError } = await canManageSession(sessionId, profile);

  if (!session) {
    return actionError(permissionError);
  }

  if (permissionError) {
    return actionError(permissionError);
  }

  if (session.status === "ended") {
    return actionError("Session allaqachon yakunlangan.");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: now,
      ends_at: session.status === "waiting" ? now : undefined,
    })
    .eq("id", session.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/sessions");
  return actionSuccess("Session yakunlandi.");
}
