"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialActionState } from "@/lib/action-state";
import { submitAttemptAction } from "../actions";

export type TakeQuestion = {
  id: string;
  order_index: number;
  answer_type_snapshot: "single_choice" | "text";
  prompt_snapshot: string;
  points_snapshot: number;
  options: { is_correct?: boolean; order_index: number; text: string }[];
};

export function TakeQuizClient({
  attemptId,
  isSubmitted,
  questions,
  resultSummary,
}: {
  attemptId: string;
  isSubmitted: boolean;
  questions: TakeQuestion[];
  resultSummary?: {
    correct: number;
    skipped: number;
    total: number;
    wrong: number;
  };
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitAttemptAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.key, state.status]);

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ActionToast state={state} />
          <p>Javoblaringiz saqlandi.</p>
          {resultSummary ? (
            <div className="grid gap-3 text-foreground md:grid-cols-4">
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Total</p>
                <p className="mt-1 text-2xl font-black">{resultSummary.total}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Correct</p>
                <p className="mt-1 text-2xl font-black">{resultSummary.correct}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Wrong</p>
                <p className="mt-1 text-2xl font-black">{resultSummary.wrong}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Skipped</p>
                <p className="mt-1 text-2xl font-black">{resultSummary.skipped}</p>
              </div>
            </div>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/sessions">Sessionlarga qaytish</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <ActionToast state={state} />
      <input name="attempt_id" type="hidden" value={attemptId} />
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle>
              {index + 1}. {question.prompt_snapshot}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.answer_type_snapshot === "single_choice" ? (
              <div className="grid gap-2">
                {question.options
                  .slice()
                  .sort((left, right) => left.order_index - right.order_index)
                  .map((option) => (
                    <label className="flex gap-3 rounded-2xl border p-3 text-sm" key={option.order_index}>
                      <input
                        name={`answer_${question.id}`}
                        type="radio"
                        value={option.order_index}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
              </div>
            ) : (
              <textarea
                className="min-h-24 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                name={`answer_${question.id}`}
                placeholder="Javobingiz"
              />
            )}
          </CardContent>
        </Card>
      ))}
      <Button disabled={isPending} type="submit">
        {isPending ? "Submit qilinmoqda" : "Javoblarni submit qilish"}
      </Button>
    </form>
  );
}
