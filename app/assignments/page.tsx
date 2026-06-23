import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  AssignmentsClient,
  type AssignmentProgress,
  type AssignmentRow,
  type CategoryOption,
  type GroupOption,
  type LevelOption,
} from "./assignments-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "created_by_user_id" | "source_assignment_id" | "status"
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

function getVisibleGroups({
  groups,
  members,
  role,
  userId,
}: {
  groups: GroupOption[];
  members: MemberRow[];
  role: UserRole;
  userId: string;
}) {
  if (role === "admin") {
    return groups;
  }

  if (role === "teacher") {
    return groups.filter((group) => group.teacher_id === userId);
  }

  const visibleGroupIds = new Set(
    members
      .filter((member) => member.user_id === userId && member.status === "active")
      .map((member) => member.group_id),
  );

  return groups.filter((group) => visibleGroupIds.has(group.id));
}

function buildProgress(
  questions: QuestionRow[],
  currentUserId: string,
): Record<string, AssignmentProgress> {
  const progressByAssignment: Record<string, AssignmentProgress> = {};

  for (const question of questions) {
    if (!question.source_assignment_id) {
      continue;
    }

    progressByAssignment[question.source_assignment_id] ??= {
      total: 0,
      pending: 0,
      approved: 0,
      own: 0,
    };

    const progress = progressByAssignment[question.source_assignment_id];
    progress.total += 1;

    if (question.status === "pending_review") {
      progress.pending += 1;
    }

    if (question.status === "approved") {
      progress.approved += 1;
    }

    if (question.created_by_user_id === currentUserId) {
      progress.own += 1;
    }
  }

  return progressByAssignment;
}

export default async function AssignmentsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={studentNavItems} title="Topshiriqlar" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin assignmentlar ochiladi.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [groupsResult, membersResult, levelsResult, categoriesResult, assignmentsResult] =
    await Promise.all([
      admin
        .from("groups")
        .select("id, name, teacher_id, status")
        .order("created_at", { ascending: false }),
      admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
      admin.from("levels").select("id, name, order_index").order("order_index"),
      admin.from("categories").select("id, name, order_index").order("order_index"),
      admin
        .from("question_assignments")
        .select(
          "id, group_id, created_by_user_id, title, topic, level_id, category_id, questions_per_student, deadline_at, share_approved_to_public_bank, status, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);

  const groups = (groupsResult.data ?? []) as GroupOption[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const levels = (levelsResult.data ?? []) as LevelOption[];
  const categories = (categoriesResult.data ?? []) as CategoryOption[];
  const allAssignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const visibleGroups = getVisibleGroups({
    groups,
    members,
    role: profile.role,
    userId: profile.id,
  });
  const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
  const assignments = allAssignments.filter((assignment) => visibleGroupIds.has(assignment.group_id));
  const assignmentIds = assignments.map((assignment) => assignment.id);
  const questionsResult =
    assignmentIds.length > 0
      ? await admin
          .from("questions")
          .select("source_assignment_id, created_by_user_id, status")
          .in("source_assignment_id", assignmentIds)
      : { data: [] };
  const progressByAssignment = buildProgress(
    (questionsResult.data ?? []) as QuestionRow[],
    profile.id,
  );
  const canManage =
    profile.role === "admin" || profile.role === "teacher" || profile.role === "support_teacher";
  const activeGroups = visibleGroups.filter((group) => group.status === "active");
  const openCount = assignments.filter((assignment) => assignment.status === "open").length;
  const readyCount = assignments.filter((assignment) => assignment.status === "ready").length;
  const expiredCount = assignments.filter(
    (assignment) =>
      assignment.deadline_at && new Date(assignment.deadline_at).getTime() < Date.now(),
  ).length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title="Topshiriqlar"
      subtitle="Teacher mavzu beradi, studentlar shu assignment bo'yicha savol yaratadi."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assignments" value={String(assignments.length)} hint="Ko'rinadigan topshiriqlar." />
        <StatCard label="Open" value={String(openCount)} hint="Savol qabul qilayotganlar." />
        <StatCard label="Ready" value={String(readyCount)} hint="Quizga tayyor assignmentlar." />
        <StatCard label="Deadline o'tgan" value={String(expiredCount)} hint="Vaqti tugagan assignmentlar." />
      </div>

      <AssignmentsClient
        assignments={assignments}
        canManage={canManage}
        categories={categories}
        groups={activeGroups}
        levels={levels}
        profile={{ id: profile.id, role: profile.role }}
        progressByAssignment={progressByAssignment}
      />
    </AppShell>
  );
}
