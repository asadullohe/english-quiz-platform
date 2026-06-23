"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import type { Database } from "@/lib/supabase/database.types";
import { createQuestionForAssignmentAction, submitDraftQuestionAction } from "../actions";

type AnswerType = Database["public"]["Tables"]["questions"]["Row"]["answer_type"];
type QuestionStatus = Database["public"]["Tables"]["questions"]["Row"]["status"];

export type OwnQuestion = {
  id: string;
  answer_type: AnswerType;
  prompt: string;
  status: QuestionStatus;
  created_at: string;
};

function QuestionEditor({ assignmentId }: { assignmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [answerType, setAnswerType] = useState<AnswerType>("single_choice");
  const [state, formAction, isPending] = useActionState(
    createQuestionForAssignmentAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setAnswerType("single_choice");
    }
  }, [state.key, state.status]);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi savol</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" ref={formRef}>
          <input name="assignment_id" type="hidden" value={assignmentId} />
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              name="answer_type"
              onChange={(event) => setAnswerType(event.target.value as AnswerType)}
              value={answerType}
            >
              <option value="single_choice">Single choice</option>
              <option value="text">Text answer</option>
            </select>
            <Input name="tags" placeholder="Tags: present-simple, habits" />
          </div>

          <textarea
            className="min-h-28 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            name="prompt"
            placeholder="Savol matni"
            required
          />

          {answerType === "single_choice" ? (
            <div className="grid gap-3">
              {[0, 1, 2, 3].map((index) => (
                <label
                  className="grid gap-3 rounded-2xl border p-3 text-sm sm:grid-cols-[auto_1fr] sm:items-center"
                  key={index}
                >
                  <input
                    defaultChecked={index === 0}
                    name="correct_option"
                    type="radio"
                    value={index}
                  />
                  <Input name={`option_${index}`} placeholder={`Variant ${index + 1}`} required />
                </label>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="text_answer" placeholder="To'g'ri javob" required />
              <Input name="text_answer_alt" placeholder="Qo'shimcha javoblar, vergul bilan" />
            </div>
          )}

          <textarea
            className="min-h-24 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            name="explanation"
            placeholder="Explanation ixtiyoriy"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isPending} name="intent" type="submit" value="draft" variant="outline">
              {isPending ? "Saqlanmoqda" : "Draft saqlash"}
            </Button>
            <Button disabled={isPending} name="intent" type="submit" value="submit">
              {isPending ? "Yuborilmoqda" : "Reviewga yuborish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitDraftButton({
  assignmentId,
  questionId,
}: {
  assignmentId: string;
  questionId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    submitDraftQuestionAction,
    initialActionState,
  );

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction}>
        <input name="assignment_id" type="hidden" value={assignmentId} />
        <input name="question_id" type="hidden" value={questionId} />
        <Button disabled={isPending} size="sm" type="submit" variant="outline">
          {isPending ? "Yuborilmoqda" : "Submit"}
        </Button>
      </form>
    </>
  );
}

export function AssignmentDetailClient({
  assignmentId,
  canSubmit,
  ownQuestions,
}: {
  assignmentId: string;
  canSubmit: boolean;
  ownQuestions: OwnQuestion[];
}) {
  return (
    <>
      {canSubmit ? (
        <QuestionEditor assignmentId={assignmentId} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Bu assignment uchun savol submit qilish hozir yopiq.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mening savollarim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownQuestions.map((question) => (
            <div
              className="flex flex-col gap-3 rounded-2xl border p-4 text-sm md:flex-row md:items-center md:justify-between"
              key={question.id}
            >
              <div>
                <p className="font-bold">{question.prompt}</p>
                <p className="mt-2 text-xs uppercase text-muted-foreground">
                  {question.answer_type} / {question.status} /{" "}
                  {new Date(question.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              {question.status === "draft" && canSubmit ? (
                <SubmitDraftButton assignmentId={assignmentId} questionId={question.id} />
              ) : null}
            </div>
          ))}

          {ownQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali savol yaratilmagan.</p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
