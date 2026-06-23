"use server";

import { redirect } from "next/navigation";
import { actionError, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SessionPoolRow = Database["public"]["Tables"]["session_question_pool"]["Row"];

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function createAttemptSnapshots(attemptId: string, poolRows: SessionPoolRow[]) {
  const admin = createAdminClient();

  return admin.from("attempt_question_snapshots").insert(
    poolRows.map((row, index) => ({
      attempt_id: attemptId,
      original_question_id: row.original_question_id,
      session_question_pool_id: row.id,
      created_by_user_id_snapshot: row.created_by_user_id_snapshot,
      order_index: index,
      points_snapshot: row.points_snapshot,
      answer_type_snapshot: row.answer_type_snapshot,
      prompt_snapshot: row.prompt_snapshot,
      explanation_snapshot: row.explanation_snapshot,
      options_snapshot: row.options_snapshot,
      accepted_answers_snapshot: row.accepted_answers_snapshot,
      image_asset_id_snapshot: row.image_asset_id_snapshot,
      audio_asset_id_snapshot: row.audio_asset_id_snapshot,
    })),
  );
}

export async function joinLiveSessionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const joinCode = getFormString(formData, "join_code").toUpperCase();
  const guestName = getFormString(formData, "guest_name");
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!joinCode) {
    return actionError("Session code kiriting.");
  }

  const { data: session } = await admin
    .from("live_sessions")
    .select("id, group_id, status, allow_guests")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (!session || (session.status !== "waiting" && session.status !== "live")) {
    return actionError("Session topilmadi yoki yopilgan.");
  }

  const { data: poolRows } = await admin
    .from("session_question_pool")
    .select("*")
    .eq("session_id", session.id);
  const pool = (poolRows ?? []) as SessionPoolRow[];

  if (pool.length === 0) {
    return actionError("Session savollari topilmadi.");
  }

  let participantId = "";
  let userId: string | null = null;

  if (user) {
    const { data: member } = await admin
      .from("group_members")
      .select("id, status")
      .eq("group_id", session.group_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member) {
      return actionError("Bu session groupiga a'zo emassiz.");
    }

    userId = user.id;

    const { data: existingParticipant } = await admin
      .from("participants")
      .select("id")
      .eq("session_id", session.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const participantResult = existingParticipant?.id
      ? await admin
          .from("participants")
          .update({ status: "active" })
          .eq("id", existingParticipant.id)
          .select("id")
          .single()
      : await admin
          .from("participants")
          .insert({
            session_id: session.id,
            participant_type: "account",
            user_id: user.id,
            guest_name: null,
            status: "active",
          })
          .select("id")
          .single();
    const { data: participant, error } = participantResult;

    if (error || !participant?.id) {
      return actionError(error?.message ?? "Participant yaratilmadi.");
    }

    participantId = participant.id;
  } else {
    if (!session.allow_guests) {
      return actionError("Bu session guest join uchun yopiq.");
    }

    if (!guestName) {
      return actionError("Guest name kiriting.");
    }

    const { data: existingParticipants } = await admin
      .from("participants")
      .select("id, guest_name")
      .eq("session_id", session.id)
      .eq("participant_type", "guest");
    const existingParticipant = (existingParticipants ?? []).find(
      (participant) => participant.guest_name?.toLowerCase() === guestName.toLowerCase(),
    );
    const participantResult = existingParticipant?.id
      ? await admin
          .from("participants")
          .update({ status: "active" })
          .eq("id", existingParticipant.id)
          .select("id")
          .single()
      : await admin
          .from("participants")
          .insert({
            session_id: session.id,
            participant_type: "guest",
            user_id: null,
            guest_name: guestName,
            status: "active",
          })
          .select("id")
          .single();
    const { data: participant, error } = participantResult;

    if (error || !participant?.id) {
      return actionError(error?.message ?? "Guest participant yaratilmadi.");
    }

    participantId = participant.id;
  }

  const { data: existingAttempt } = await admin
    .from("attempts")
    .select("id, status")
    .eq("participant_id", participantId)
    .eq("live_session_id", session.id)
    .maybeSingle();

  if (existingAttempt?.id) {
    redirect(`/sessions/take/${existingAttempt.id}`);
  }

  const { data: attempt, error: attemptError } = await admin
    .from("attempts")
    .insert({
      attempt_type: "live",
      user_id: userId,
      participant_id: participantId,
      live_session_id: session.id,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (attemptError || !attempt?.id) {
    return actionError(attemptError?.message ?? "Attempt yaratilmadi.");
  }

  const { error: snapshotError } = await createAttemptSnapshots(attempt.id, pool);

  if (snapshotError) {
    await admin.from("attempts").delete().eq("id", attempt.id);
    return actionError(snapshotError.message);
  }

  redirect(`/sessions/take/${attempt.id}`);
}
