import { notFound } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { TakeQuizClient, type TakeQuestion } from "./take-quiz-client";

type SnapshotOption = {
  is_correct?: boolean;
  order_index: number;
  text: string;
};

function asOptions(value: Json | null): SnapshotOption[] {
  return Array.isArray(value) ? (value as SnapshotOption[]) : [];
}

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("attempts")
    .select("id, status, live_session_id")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    notFound();
  }

  const [sessionResult, snapshotsResult] = await Promise.all([
    admin
      .from("live_sessions")
      .select("title_snapshot, join_code, status, ends_at")
      .eq("id", attempt.live_session_id)
      .maybeSingle(),
    admin
      .from("attempt_question_snapshots")
      .select("id, order_index, answer_type_snapshot, prompt_snapshot, points_snapshot, options_snapshot")
      .eq("attempt_id", attempt.id)
      .order("order_index"),
  ]);
  const session = sessionResult.data;
  const snapshotRows = (snapshotsResult.data ?? []) as Array<
    TakeQuestion & { options_snapshot: Json | null }
  >;
  const questions = snapshotRows.map((snapshot) => ({
      id: snapshot.id,
      order_index: snapshot.order_index,
      answer_type_snapshot: snapshot.answer_type_snapshot,
      prompt_snapshot: snapshot.prompt_snapshot,
      points_snapshot: snapshot.points_snapshot,
      options: asOptions(snapshot.options_snapshot),
    }));
  const answerResult =
    attempt.status !== "in_progress" && snapshotRows.length > 0
      ? await admin
          .from("answers")
          .select("attempt_question_snapshot_id, is_skipped, final_is_correct")
          .in(
            "attempt_question_snapshot_id",
            snapshotRows.map((snapshot) => snapshot.id),
          )
      : { data: [] };
  const answers = answerResult.data ?? [];
  const resultSummary =
    attempt.status !== "in_progress"
      ? {
          total: snapshotRows.length,
          correct: answers.filter((answer) => answer.final_is_correct === true).length,
          wrong: answers.filter((answer) => answer.final_is_correct === false).length,
          skipped: answers.filter((answer) => answer.is_skipped).length,
        }
      : undefined;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-black">QuizUstoz</span>
            <span className="block text-xs text-muted-foreground">Live quiz</span>
          </span>
        </Link>

        <header>
          <p className="text-sm font-semibold text-accent">Code {session?.join_code ?? "--"}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {session?.title_snapshot ?? "Live quiz"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Status: {session?.status ?? "--"} / Savollar: {questions.length}
          </p>
        </header>

        <TakeQuizClient
          attemptId={attempt.id}
          isSubmitted={attempt.status !== "in_progress"}
          questions={questions}
          resultSummary={resultSummary}
        />
      </div>
    </main>
  );
}
