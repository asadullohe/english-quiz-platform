import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { AssignmentDetailClient, type OwnQuestion } from "./assignment-detail-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type AssignmentRow = Database["public"]["Tables"]["question_assignments"]["Row"];
type GroupRow = Pick<
  Database["public"]["Tables"]["groups"]["Row"],
  "id" | "name" | "teacher_id" | "status"
>;
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "id" | "created_by_user_id" | "answer_type" | "prompt" | "status" | "created_at"
>;

const adminNavItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/groups", label: "All groups" },
  { href: "/review/reports", label: "Moderation" },
];

const teacherNavItems = [
  { href: "/groups", label: "Guruhlar" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/quizzes", label: "Quiz builder" },
  { href: "/sessions", label: "Live sessions" },
];

const studentNavItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/sessions", label: "Live quizlar" },
  { href: "/self-practice", label: "Self practice" },
];

const supportNavItems = [
  { href: "/groups", label: "Assigned groups" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/review/reports", label: "Reports" },
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

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return "Deadline yo'q";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(deadline));
}

function canViewAssignment({
  assignment,
  group,
  members,
  role,
  userId,
}: {
  assignment: AssignmentRow;
  group: GroupRow | null;
  members: MemberRow[];
  role: UserRole;
  userId: string;
}) {
  if (role === "admin") {
    return true;
  }

  if (role === "teacher") {
    return group?.teacher_id === userId;
  }

  return members.some(
    (member) =>
      member.group_id === assignment.group_id &&
      member.user_id === userId &&
      member.status === "active",
  );
}

export default async function AssignmentDetailPage({
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
  const { data: assignmentData } = await admin
    .from("question_assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const assignment = assignmentData as AssignmentRow | null;

  if (!assignment) {
    notFound();
  }

  const [groupResult, membersResult, questionsResult] = await Promise.all([
    admin
      .from("groups")
      .select("id, name, teacher_id, status")
      .eq("id", assignment.group_id)
      .maybeSingle(),
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
    admin
      .from("questions")
      .select("id, created_by_user_id, answer_type, prompt, status, created_at")
      .eq("source_assignment_id", assignment.id)
      .order("created_at", { ascending: false }),
  ]);

  const group = groupResult.data as GroupRow | null;
  const members = (membersResult.data ?? []) as MemberRow[];

  if (
    !canViewAssignment({
      assignment,
      group,
      members,
      role: profile.role,
      userId: profile.id,
    })
  ) {
    redirect("/assignments");
  }

  const questions = (questionsResult.data ?? []) as QuestionRow[];
  const ownQuestions = questions.filter(
    (question) => question.created_by_user_id === profile.id,
  ) as OwnQuestion[];
  const studentMembership = members.find(
    (member) =>
      member.group_id === assignment.group_id &&
      member.user_id === profile.id &&
      member.role === "student" &&
      member.status === "active",
  );
  const deadlinePassed =
    assignment.deadline_at && new Date(assignment.deadline_at).getTime() < Date.now();
  const canSubmit =
    profile.role === "student" &&
    Boolean(studentMembership) &&
    assignment.status === "open" &&
    !deadlinePassed;
  const approvedCount = questions.filter((question) => question.status === "approved").length;
  const pendingCount = questions.filter((question) => question.status === "pending_review").length;
  const draftCount = ownQuestions.filter((question) => question.status === "draft").length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title={assignment.title}
      subtitle={`${group?.name ?? "Group"} assignment: ${assignment.topic}`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Required" value={String(assignment.questions_per_student)} hint="Har student uchun." />
        <StatCard label="My questions" value={String(ownQuestions.length)} hint="Siz yaratgan savollar." />
        <StatCard label="Pending" value={String(pendingCount)} hint="Review kutayotganlar." />
        <StatCard label="Approved" value={String(approvedCount)} hint="Tasdiqlangan savollar." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment brief</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold">{assignment.topic}</p>
            <p className="mt-2 text-muted-foreground">
              Deadline: {formatDeadline(assignment.deadline_at)} / Status: {assignment.status}
              {draftCount > 0 ? ` / Draft: ${draftCount}` : ""}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/assignments">Assignmentlarga qaytish</Link>
          </Button>
        </CardContent>
      </Card>

      <AssignmentDetailClient
        assignmentId={assignment.id}
        canSubmit={canSubmit}
        ownQuestions={ownQuestions}
      />
    </AppShell>
  );
}
