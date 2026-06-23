"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import type { Database } from "@/lib/supabase/database.types";
import { createQuizTemplateAction } from "./actions";

type FeedbackMode = Database["public"]["Tables"]["quiz_templates"]["Row"]["feedback_mode"];
type TemplateStatus = Database["public"]["Tables"]["quiz_templates"]["Row"]["status"];

export type QuizGroup = {
  id: string;
  name: string;
  teacher_id: string;
};

export type QuizLevel = {
  id: string;
  name: string;
};

export type QuizCategory = {
  id: string;
  name: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  answer_type: "single_choice" | "text";
  visibility: "public" | "group_only";
  groupName: string;
  levelName: string;
  categoryName: string;
};

export type QuizTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  group_id: string | null;
  question_count_per_participant: number;
  duration_minutes: number;
  feedback_mode: FeedbackMode;
  allow_guests: boolean;
  status: TemplateStatus;
  created_at: string;
  selectedQuestionCount: number;
};

function CreateQuizForm({
  categories,
  groups,
  levels,
  questions,
}: {
  categories: QuizCategory[];
  groups: QuizGroup[];
  levels: QuizLevel[];
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createQuizTemplateAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.key, state.status]);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Quiz yaratish uchun active group kerak.
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Quiz yaratish uchun kamida bitta approved savol kerak.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi quiz template</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5" ref={formRef}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="title" placeholder="Quiz title" required />
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              name="group_id"
              required
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="min-h-20 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            name="description"
            placeholder="Description ixtiyoriy"
          />

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_140px]">
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              name="level_id"
            >
              <option value="">Level ixtiyoriy</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              name="category_id"
            >
              <option value="">Category ixtiyoriy</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input defaultValue={10} min={1} name="duration_minutes" required type="number" />
            <Input
              defaultValue={Math.min(questions.length, 10)}
              min={1}
              name="question_count_per_participant"
              required
              type="number"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue="after_finish"
              name="feedback_mode"
            >
              <option value="after_finish">Feedback after finish</option>
              <option value="instant">Instant feedback</option>
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue="true"
              name="show_correct_answers"
            >
              <option value="true">Show correct answers</option>
              <option value="false">Hide correct answers</option>
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue="false"
              name="allow_guests"
            >
              <option value="false">Guests off</option>
              <option value="true">Guests on</option>
            </select>
            <select
              className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
              defaultValue="draft"
              name="status"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="grid max-h-[420px] gap-3 overflow-y-auto rounded-2xl border p-3">
            {questions.map((question) => (
              <label
                className="grid gap-3 rounded-xl border p-3 text-sm md:grid-cols-[auto_1fr]"
                key={question.id}
              >
                <input name="question_id" type="checkbox" value={question.id} />
                <span>
                  <span className="block font-bold">{question.prompt}</span>
                  <span className="mt-1 block text-xs uppercase text-muted-foreground">
                    {question.answer_type} / {question.visibility} / {question.groupName} /{" "}
                    {question.levelName} / {question.categoryName}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <Button disabled={isPending} type="submit">
            {isPending ? "Yaratilmoqda" : "Quiz template yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function QuizzesClient({
  categories,
  groups,
  levels,
  questions,
  templates,
}: {
  categories: QuizCategory[];
  groups: QuizGroup[];
  levels: QuizLevel[];
  questions: QuizQuestion[];
  templates: QuizTemplateRow[];
}) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return (
    <>
      <CreateQuizForm categories={categories} groups={groups} levels={levels} questions={questions} />

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{template.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {groupsById.get(template.group_id ?? "")?.name ?? "Group yo'q"} /{" "}
                    {template.selectedQuestionCount} selected / {template.duration_minutes} min
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
                  {template.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-4">
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Per participant</p>
                <p className="mt-1 text-2xl font-black">{template.question_count_per_participant}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Feedback</p>
                <p className="mt-1 font-bold">{template.feedback_mode}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Guests</p>
                <p className="mt-1 font-bold">{template.allow_guests ? "On" : "Off"}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-muted-foreground">Created</p>
                <p className="mt-1 font-bold">
                  {new Date(template.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Hali quiz template yo&apos;q.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
