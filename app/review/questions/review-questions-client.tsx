"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialActionState, type ActionState } from "@/lib/action-state";
import {
  approveQuestionAction,
  rejectQuestionAction,
  requestQuestionChangesAction,
} from "./actions";

export type ReviewOption = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
};

export type ReviewTextAnswer = {
  id: string;
  question_id: string;
  answer_text: string;
};

export type ReviewQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  answer_type: "single_choice" | "text";
  created_at: string;
  creatorName: string;
  groupName: string;
  assignmentTitle: string;
  tags: string[];
  options: ReviewOption[];
  textAnswers: ReviewTextAnswer[];
};

function useRefreshOnSuccess(state: ActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.key, state.status]);
}

function ReviewForm({
  action,
  button,
  commentPlaceholder,
  questionId,
  requiresComment,
}: {
  action: (previousState: ActionState, formData: FormData) => Promise<ActionState>;
  button: ReactNode;
  commentPlaceholder: string;
  questionId: string;
  requiresComment?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useRefreshOnSuccess(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.key, state.status]);

  return (
    <form action={formAction} className="space-y-2" ref={formRef}>
      <ActionToast state={state} />
      <input name="question_id" type="hidden" value={questionId} />
      <textarea
        className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        name="comment"
        placeholder={commentPlaceholder}
        required={requiresComment}
      />
      <Button className="w-full" disabled={isPending} size="sm" type="submit">
        {isPending ? "Saqlanmoqda" : button}
      </Button>
    </form>
  );
}

function AnswerPreview({ question }: { question: ReviewQuestion }) {
  if (question.answer_type === "text") {
    return (
      <div className="grid gap-2">
        {question.textAnswers.map((answer) => (
          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm" key={answer.id}>
            {answer.answer_text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {question.options
        .slice()
        .sort((left, right) => left.order_index - right.order_index)
        .map((option) => (
          <div
            className={
              option.is_correct
                ? "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                : "rounded-xl border bg-muted/40 px-3 py-2 text-sm"
            }
            key={option.id}
          >
            {option.text}
          </div>
        ))}
    </div>
  );
}

function QuestionCard({ question }: { question: ReviewQuestion }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{question.prompt}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {question.creatorName} / {question.groupName} / {question.assignmentTitle}
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
            {question.answer_type}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <AnswerPreview question={question} />

        {question.explanation ? (
          <div className="rounded-2xl border p-4 text-sm">
            <p className="text-xs font-bold uppercase text-muted-foreground">Explanation</p>
            <p className="mt-2">{question.explanation}</p>
          </div>
        ) : null}

        {question.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <span
                className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-3">
          <ReviewForm
            action={approveQuestionAction}
            button="Approve"
            commentPlaceholder="Internal note ixtiyoriy"
            questionId={question.id}
          />
          <ReviewForm
            action={requestQuestionChangesAction}
            button="Needs changes"
            commentPlaceholder="Student ko'radigan izoh"
            questionId={question.id}
            requiresComment
          />
          <ReviewForm
            action={rejectQuestionAction}
            button="Reject"
            commentPlaceholder="Reject sababi"
            questionId={question.id}
            requiresComment
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewQuestionsClient({ questions }: { questions: ReviewQuestion[] }) {
  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}

      {questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Pending review savol yo&apos;q.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
