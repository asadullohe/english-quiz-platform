"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { Database } from "@/lib/supabase/database.types";
import { createAssignmentAction, updateAssignmentStatusAction } from "./actions";

type AssignmentStatus =
  Database["public"]["Tables"]["question_assignments"]["Row"]["status"];
type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

export type AssignmentProfile = {
  id: string;
  role: UserRole;
};

export type GroupOption = {
  id: string;
  name: string;
  teacher_id: string;
  status: "active" | "archived";
};

export type LevelOption = {
  id: string;
  name: string;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type AssignmentRow = {
  id: string;
  group_id: string;
  created_by_user_id: string;
  title: string;
  topic: string;
  level_id: string | null;
  category_id: string | null;
  questions_per_student: number;
  deadline_at: string | null;
  share_approved_to_public_bank: boolean;
  status: AssignmentStatus;
  created_at: string;
};

export type AssignmentProgress = {
  total: number;
  pending: number;
  approved: number;
  own: number;
};

type Option<T extends string = string> = {
  value: T;
  label: string;
};

const statusOptions: Option<AssignmentStatus>[] = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "ready", label: "Ready" },
  { value: "used", label: "Used" },
  { value: "archived", label: "Archived" },
];

function SelectField({
  defaultValue,
  disabled,
  form,
  name,
  options,
  onChange,
}: {
  defaultValue: string;
  disabled?: boolean;
  form?: string;
  name: string;
  options: Option[];
  onChange?: () => void;
}) {
  return (
    <select
      className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
      defaultValue={defaultValue}
      disabled={disabled}
      form={form}
      name={name}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function useRefreshOnSuccess(
  state: ActionState,
  formRef?: RefObject<HTMLFormElement | null>,
) {
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef?.current?.reset();
    router.refresh();
  }, [formRef, router, state.key, state.status]);
}

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return "Deadline yo'q";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(deadline));
}

function getDeadlineTone(deadline: string | null) {
  if (!deadline) {
    return "text-muted-foreground";
  }

  return new Date(deadline).getTime() < Date.now() ? "text-destructive" : "text-muted-foreground";
}

function CreateAssignmentForm({
  categories,
  groups,
  levels,
}: {
  categories: CategoryOption[];
  groups: GroupOption[];
  levels: LevelOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createAssignmentAction,
    initialActionState,
  );

  useRefreshOnSuccess(state, formRef);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Assignment yaratish uchun active group kerak.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3" ref={formRef}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <Input name="title" placeholder="Title: Present Simple practice" required />
            <Input name="topic" placeholder="Topic: daily routines, habits" required />
          </div>
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
            <SelectField
              defaultValue={groups[0]?.id ?? ""}
              name="group_id"
              options={groups.map((group) => ({ value: group.id, label: group.name }))}
            />
            <SelectField
              defaultValue=""
              name="level_id"
              options={[
                { value: "", label: "Level ixtiyoriy" },
                ...levels.map((level) => ({ value: level.id, label: level.name })),
              ]}
            />
            <SelectField
              defaultValue=""
              name="category_id"
              options={[
                { value: "", label: "Category ixtiyoriy" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_220px_auto]">
            <Input
              defaultValue={3}
              min={1}
              name="questions_per_student"
              placeholder="Savollar soni"
              required
              type="number"
            />
            <Input name="deadline_at" type="datetime-local" />
            <SelectField
              defaultValue="true"
              name="share_public"
              options={[
                { value: "true", label: "Public bankka qo'shish" },
                { value: "false", label: "Faqat group ichida" },
              ]}
            />
            <Button disabled={isPending} type="submit">
              {isPending ? "Yaratilmoqda" : "Yaratish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StatusSelect({ assignmentId, status }: { assignmentId: string; status: AssignmentStatus }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    updateAssignmentStatusAction,
    initialActionState,
  );

  useRefreshOnSuccess(state);

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction} className="hidden" id={formId} ref={formRef}>
        <input name="assignment_id" type="hidden" value={assignmentId} />
      </form>
      <SelectField
        defaultValue={status}
        disabled={isPending}
        form={formId}
        name="status"
        onChange={() => formRef.current?.requestSubmit()}
        options={statusOptions}
      />
    </>
  );
}

function AssignmentCard({
  assignment,
  canManage,
  categoriesById,
  groupsById,
  levelsById,
  progress,
}: {
  assignment: AssignmentRow;
  canManage: boolean;
  categoriesById: Map<string, CategoryOption>;
  groupsById: Map<string, GroupOption>;
  levelsById: Map<string, LevelOption>;
  progress: AssignmentProgress;
}) {
  const group = groupsById.get(assignment.group_id);
  const levelName = assignment.level_id
    ? levelsById.get(assignment.level_id)?.name ?? "Level topilmadi"
    : "Level ixtiyoriy";
  const categoryName = assignment.category_id
    ? categoriesById.get(assignment.category_id)?.name ?? "Category topilmadi"
    : "Category ixtiyoriy";
  const deadlineTone = getDeadlineTone(assignment.deadline_at);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{assignment.title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{assignment.topic}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">
              {group?.name ?? "Group topilmadi"} / {levelName} / {categoryName}
            </p>
          </div>
          {canManage ? (
            <StatusSelect assignmentId={assignment.id} status={assignment.status} />
          ) : (
            <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
              {assignment.status}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Required</p>
            <p className="mt-1 text-2xl font-black">{assignment.questions_per_student}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Submitted</p>
            <p className="mt-1 text-2xl font-black">{progress.total}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Approved</p>
            <p className="mt-1 text-2xl font-black">{progress.approved}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">My questions</p>
            <p className="mt-1 text-2xl font-black">{progress.own}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <p className={deadlineTone}>{formatDeadline(assignment.deadline_at)}</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <p className="text-muted-foreground">
              {assignment.share_approved_to_public_bank
                ? "Approved savollar public bankka tushadi."
                : "Approved savollar faqat group ichida qoladi."}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/assignments/${assignment.id}`}>Ochish</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentsClient({
  assignments,
  canManage,
  categories,
  groups,
  levels,
  profile,
  progressByAssignment,
}: {
  assignments: AssignmentRow[];
  canManage: boolean;
  categories: CategoryOption[];
  groups: GroupOption[];
  levels: LevelOption[];
  profile: AssignmentProfile;
  progressByAssignment: Record<string, AssignmentProgress>;
}) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const levelsById = new Map(levels.map((level) => [level.id, level]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return (
    <>
      {canManage ? <CreateAssignmentForm categories={categories} groups={groups} levels={levels} /> : null}

      {!canManage && profile.role === "student" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Assignmentlar group teacheri tomonidan beriladi. Group yo&apos;q bo&apos;lsa invite code bilan qo&apos;shiling.</p>
            <Button asChild variant="outline">
              <Link href="/groups/join">Groupga qo&apos;shilish</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <AssignmentCard
            assignment={assignment}
            canManage={canManage}
            categoriesById={categoriesById}
            groupsById={groupsById}
            key={assignment.id}
            levelsById={levelsById}
            progress={progressByAssignment[assignment.id] ?? { total: 0, pending: 0, approved: 0, own: 0 }}
          />
        ))}

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Hali assignment yo&apos;q.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
