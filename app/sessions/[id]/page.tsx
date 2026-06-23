import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type GroupRow = Pick<Database["public"]["Tables"]["groups"]["Row"], "id" | "name" | "teacher_id">;
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type SessionRow = Database["public"]["Tables"]["live_sessions"]["Row"];
type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];
type AttemptRow = Database["public"]["Tables"]["attempts"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["attempt_question_snapshots"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name">;

const adminNavItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/groups", label: "All groups" },
  { href: "/review/reports", label: "Moderation" },
];

const teacherNavItems = [
  { href: "/groups", label: "Guruhlar" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/question-bank", label: "Question bank" },
  { href: "/quizzes", label: "Quiz builder" },
  { href: "/sessions", label: "Live sessions" },
];

const supportNavItems = [
  { href: "/groups", label: "Assigned groups" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/question-bank", label: "Question bank" },
  { href: "/quizzes", label: "Quiz builder" },
  { href: "/sessions", label: "Live sessions" },
  { href: "/review/reports", label: "Reports" },
];

const studentNavItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/question-bank", label: "Question bank" },
  { href: "/sessions", label: "Live quizlar" },
  { href: "/self-practice", label: "Self practice" },
];

function navForRole(role: UserRole) {
  if (role === "admin") {
    return adminNavItems;
  }

  if (role === "teacher") {
    return teacherNavItems;
  }

  if (role === "support_teacher") {
    return supportNavItems;
  }

  return studentNavItems;
}

function canViewReport({
  group,
  members,
  role,
  session,
  userId,
}: {
  group: GroupRow | null;
  members: MemberRow[];
  role: UserRole;
  session: SessionRow;
  userId: string;
}) {
  if (role === "admin" || session.created_by_user_id === userId) {
    return true;
  }

  if (role === "teacher") {
    return group?.teacher_id === userId;
  }

  if (role === "support_teacher") {
    return members.some(
      (member) =>
        member.group_id === session.group_id &&
        member.user_id === userId &&
        member.role === "support_teacher" &&
        member.status === "active",
    );
  }

  return false;
}

function formatPercent(value: number, total: number) {
  if (total === 0) {
    return "--";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function participantName(participant: ParticipantRow, profilesById: Map<string, ProfileRow>) {
  if (participant.participant_type === "guest") {
    return participant.guest_name ?? "Guest";
  }

  return participant.user_id ? profilesById.get(participant.user_id)?.full_name ?? "User" : "User";
}

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    redirect("/auth/login");
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: sessionData } = await admin
    .from("live_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const session = sessionData as SessionRow | null;

  if (!session) {
    notFound();
  }

  const [groupResult, membersResult, participantsResult, attemptsResult] = await Promise.all([
    session.group_id
      ? admin.from("groups").select("id, name, teacher_id").eq("id", session.group_id).maybeSingle()
      : { data: null },
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
    admin.from("participants").select("*").eq("session_id", session.id),
    admin.from("attempts").select("*").eq("live_session_id", session.id),
  ]);
  const group = groupResult.data as GroupRow | null;
  const members = (membersResult.data ?? []) as MemberRow[];

  if (
    !canViewReport({
      group,
      members,
      role: profile.role,
      session,
      userId: profile.id,
    })
  ) {
    redirect("/sessions");
  }

  const participants = (participantsResult.data ?? []) as ParticipantRow[];
  const attempts = (attemptsResult.data ?? []) as AttemptRow[];
  const attemptIds = attempts.map((attempt) => attempt.id);
  const userIds = participants
    .map((participant) => participant.user_id)
    .filter((userId): userId is string => Boolean(userId));
  const [profilesResult, snapshotsResult] = await Promise.all([
    userIds.length > 0
      ? admin.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] },
    attemptIds.length > 0
      ? admin
          .from("attempt_question_snapshots")
          .select("*")
          .in("attempt_id", attemptIds)
          .order("order_index")
      : { data: [] },
  ]);
  const profilesById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((item) => [item.id, item]),
  );
  const snapshots = (snapshotsResult.data ?? []) as SnapshotRow[];
  const snapshotIds = snapshots.map((snapshot) => snapshot.id);
  const answersResult =
    snapshotIds.length > 0
      ? await admin.from("answers").select("*").in("attempt_question_snapshot_id", snapshotIds)
      : { data: [] };
  const answers = (answersResult.data ?? []) as AnswerRow[];
  const participantRows = participants.map((participant) => {
    const attempt = attempts.find((item) => item.participant_id === participant.id);
    const attemptSnapshots = attempt
      ? snapshots.filter((snapshot) => snapshot.attempt_id === attempt.id)
      : [];
    const attemptAnswers = answers.filter((answer) =>
      attemptSnapshots.some((snapshot) => snapshot.id === answer.attempt_question_snapshot_id),
    );
    const correct = attemptAnswers.filter((answer) => answer.final_is_correct === true).length;
    const wrong = attemptAnswers.filter((answer) => answer.final_is_correct === false).length;
    const skipped = attemptAnswers.filter((answer) => answer.is_skipped).length;

    return {
      id: participant.id,
      name: participantName(participant, profilesById),
      status: attempt?.status ?? participant.status,
      total: attemptSnapshots.length,
      correct,
      wrong,
      skipped,
      accuracy: formatPercent(correct, attemptSnapshots.length),
    };
  });
  const questionRows = snapshots
    .filter(
      (snapshot, index, all) =>
        all.findIndex((item) => item.original_question_id === snapshot.original_question_id) === index,
    )
    .map((snapshot) => {
      const relatedSnapshots = snapshots.filter(
        (item) => item.original_question_id === snapshot.original_question_id,
      );
      const relatedAnswers = answers.filter((answer) =>
        relatedSnapshots.some((item) => item.id === answer.attempt_question_snapshot_id),
      );
      const correct = relatedAnswers.filter((answer) => answer.final_is_correct === true).length;
      const wrong = relatedAnswers.filter((answer) => answer.final_is_correct === false).length;
      const skipped = relatedAnswers.filter((answer) => answer.is_skipped).length;

      return {
        id: snapshot.id,
        prompt: snapshot.prompt_snapshot,
        answered: relatedAnswers.length,
        correct,
        wrong,
        skipped,
        accuracy: formatPercent(correct, relatedAnswers.length),
      };
    });
  const totalAnswers = answers.length;
  const totalCorrect = answers.filter((answer) => answer.final_is_correct === true).length;
  const submittedCount = attempts.filter((attempt) => attempt.status !== "in_progress").length;
  const csvRows = [
    ["name", "status", "total", "correct", "wrong", "skipped", "accuracy"],
    ...participantRows.map((row) => [
      row.name,
      row.status,
      String(row.total),
      String(row.correct),
      String(row.wrong),
      String(row.skipped),
      row.accuracy,
    ]),
  ];
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n"),
  )}`;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title={`${session.title_snapshot} report`}
      subtitle={`${group?.name ?? "Group"} / code ${session.join_code}`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Participants" value={String(participants.length)} hint="Joined users/guests." />
        <StatCard label="Submitted" value={String(submittedCount)} hint="Submitted attempts." />
        <StatCard label="Answers" value={String(totalAnswers)} hint="Saved answers." />
        <StatCard label="Accuracy" value={formatPercent(totalCorrect, totalAnswers)} hint="Overall correct rate." />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>CSV export participant summary uchun tayyor.</p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a download={`${session.join_code}-report.csv`} href={csvHref}>
                CSV export
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sessions">Sessionlarga qaytish</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participant results</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Correct</th>
                <th className="py-3 pr-4">Wrong</th>
                <th className="py-3 pr-4">Skipped</th>
                <th className="py-3 pr-4">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {participantRows.map((row) => (
                <tr className="border-b last:border-0" key={row.id}>
                  <td className="py-3 pr-4 font-bold">{row.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.status}</td>
                  <td className="py-3 pr-4">{row.correct}</td>
                  <td className="py-3 pr-4">{row.wrong}</td>
                  <td className="py-3 pr-4">{row.skipped}</td>
                  <td className="py-3 pr-4">{row.accuracy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionRows.map((row) => (
            <div className="rounded-2xl border p-4 text-sm" key={row.id}>
              <p className="font-bold">{row.prompt}</p>
              <p className="mt-2 text-muted-foreground">
                Answered {row.answered} / Correct {row.correct} / Wrong {row.wrong} / Skipped{" "}
                {row.skipped} / Accuracy {row.accuracy}
              </p>
            </div>
          ))}
          {questionRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali question analytics yo&apos;q.</p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
