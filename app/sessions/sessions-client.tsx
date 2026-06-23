"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialActionState } from "@/lib/action-state";
import {
  createLiveSessionAction,
  endLiveSessionAction,
  startLiveSessionAction,
} from "./actions";

export type SessionTemplate = {
  id: string;
  title: string;
  groupName: string;
  duration_minutes: number;
  question_count_per_participant: number;
  selectedQuestionCount: number;
};

export type LiveSessionRow = {
  id: string;
  quiz_template_id: string | null;
  groupName: string;
  join_code: string;
  title_snapshot: string;
  duration_minutes: number;
  question_count_per_participant: number;
  feedback_mode: "instant" | "after_finish";
  allow_guests: boolean;
  status: "waiting" | "live" | "ended";
  started_at: string | null;
  ends_at: string | null;
  ended_at: string | null;
  created_at: string;
  poolCount: number;
};

function CreateSessionForm({ templates }: { templates: SessionTemplate[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createLiveSessionAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.key, state.status]);

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Live session yaratish uchun active quiz template kerak.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi live session</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_auto]" ref={formRef}>
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
            name="template_id"
            required
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title} / {template.groupName} / {template.selectedQuestionCount} savol
              </option>
            ))}
          </select>
          <Button disabled={isPending} type="submit">
            {isPending ? "Yaratilmoqda" : "Session yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SessionActionButton({
  action,
  label,
  pendingLabel,
  sessionId,
  variant = "outline",
}: {
  action: (previousState: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  label: string;
  pendingLabel: string;
  sessionId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.key, state.status]);

  return (
    <form action={formAction}>
      <ActionToast state={state} />
      <input name="session_id" type="hidden" value={sessionId} />
      <Button disabled={isPending} size="sm" type="submit" variant={variant}>
        {isPending ? pendingLabel : label}
      </Button>
    </form>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SessionsClient({
  sessions,
  templates,
}: {
  sessions: LiveSessionRow[];
  templates: SessionTemplate[];
}) {
  return (
    <>
      <CreateSessionForm templates={templates} />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Studentlar va guestlar join code orqali sessionga kiradi.</p>
          <Button asChild variant="outline">
            <Link href="/sessions/join">Join page</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{session.title_snapshot}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {session.groupName} / code {session.join_code} / {session.poolCount} frozen
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
                  {session.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="mt-1 text-2xl font-black">{session.duration_minutes}m</p>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Per participant</p>
                  <p className="mt-1 text-2xl font-black">
                    {session.question_count_per_participant}
                  </p>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Feedback</p>
                  <p className="mt-1 font-bold">{session.feedback_mode}</p>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Guests</p>
                  <p className="mt-1 font-bold">{session.allow_guests ? "On" : "Off"}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-3">
                <p className="text-muted-foreground">Started: {formatDateTime(session.started_at)}</p>
                <p className="text-muted-foreground">Ends: {formatDateTime(session.ends_at)}</p>
                <p className="text-muted-foreground">Ended: {formatDateTime(session.ended_at)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/sessions/${session.id}`}>Report</Link>
                </Button>
                {session.status === "waiting" ? (
                  <SessionActionButton
                    action={startLiveSessionAction}
                    label="Start"
                    pendingLabel="Starting"
                    sessionId={session.id}
                  />
                ) : null}
                {session.status !== "ended" ? (
                  <SessionActionButton
                    action={endLiveSessionAction}
                    label="End"
                    pendingLabel="Ending"
                    sessionId={session.id}
                    variant="ghost"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Hali live session yo&apos;q.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
