"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type SnapshotOption = {
  is_correct: boolean;
  order_index: number;
  text: string;
};

type SnapshotAnswer = {
  answer_text: string;
  normalized_answer: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTextAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function asOptions(value: Json | null): SnapshotOption[] {
  return Array.isArray(value) ? (value as SnapshotOption[]) : [];
}

function asAnswers(value: Json | null): SnapshotAnswer[] {
  return Array.isArray(value) ? (value as SnapshotAnswer[]) : [];
}

export async function submitAttemptAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const attemptId = getFormString(formData, "attempt_id");

  if (!attemptId) {
    return actionError("Attempt topilmadi.");
  }

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("attempts")
    .select("id, status, participant_id")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    return actionError("Attempt topilmadi.");
  }

  if (attempt.status !== "in_progress") {
    return actionError("Attempt allaqachon submit qilingan.");
  }

  const { data: snapshots } = await admin
    .from("attempt_question_snapshots")
    .select("id, answer_type_snapshot, options_snapshot, accepted_answers_snapshot")
    .eq("attempt_id", attempt.id)
    .order("order_index");
  const rows = snapshots ?? [];
  const now = new Date().toISOString();
  const answerRows = rows.map((snapshot) => {
    if (snapshot.answer_type_snapshot === "single_choice") {
      const selected = getFormString(formData, `answer_${snapshot.id}`);
      const options = asOptions(snapshot.options_snapshot);
      const selectedIndex = selected ? Number(selected) : NaN;
      const selectedOption = options.find((option) => option.order_index === selectedIndex);
      const isSkipped = !selectedOption;

      return {
        attempt_question_snapshot_id: snapshot.id,
        selected_option_snapshot_id: isSkipped ? null : String(selectedIndex),
        text_answer: null,
        normalized_text_answer: null,
        is_skipped: isSkipped,
        auto_is_correct: isSkipped ? null : Boolean(selectedOption?.is_correct),
        final_is_correct: isSkipped ? null : Boolean(selectedOption?.is_correct),
        locked_at: now,
      };
    }

    const textAnswer = getFormString(formData, `answer_${snapshot.id}`);
    const normalized = normalizeTextAnswer(textAnswer);
    const accepted = asAnswers(snapshot.accepted_answers_snapshot);
    const isSkipped = !normalized;
    const isCorrect = accepted.some((answer) => answer.normalized_answer === normalized);

    return {
      attempt_question_snapshot_id: snapshot.id,
      selected_option_snapshot_id: null,
      text_answer: textAnswer || null,
      normalized_text_answer: normalized || null,
      is_skipped: isSkipped,
      auto_is_correct: isSkipped ? null : isCorrect,
      final_is_correct: isSkipped ? null : isCorrect,
      locked_at: now,
    };
  });

  if (answerRows.length > 0) {
    const { error: answersError } = await admin.from("answers").insert(answerRows);

    if (answersError) {
      return actionError(answersError.message);
    }
  }

  const { error: attemptError } = await admin
    .from("attempts")
    .update({ status: "submitted", submitted_at: now })
    .eq("id", attempt.id);

  if (attemptError) {
    return actionError(attemptError.message);
  }

  if (attempt.participant_id) {
    await admin.from("participants").update({ status: "submitted" }).eq("id", attempt.participant_id);
  }

  revalidatePath(`/sessions/take/${attempt.id}`);
  return actionSuccess("Javoblar submit qilindi.");
}

export async function leaveSubmittedAttemptAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const attemptId = getFormString(formData, "attempt_id");

  if (!attemptId) {
    return actionError("Attempt topilmadi.");
  }

  redirect("/sessions");
}
