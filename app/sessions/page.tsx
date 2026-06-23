import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  SessionsClient,
  type LiveSessionRow,
  type SessionTemplate,
} from "./sessions-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type GroupRow = Pick<Database["public"]["Tables"]["groups"]["Row"], "id" | "name" | "teacher_id">;
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type TemplateRow = Database["public"]["Tables"]["quiz_templates"]["Row"];
type TemplateQuestionRow = Database["public"]["Tables"]["quiz_template_questions"]["Row"];
type SessionRow = Database["public"]["Tables"]["live_sessions"]["Row"];
type SessionPoolRow = Database["public"]["Tables"]["session_question_pool"]["Row"];

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

function getVisibleGroupIds({
  groups,
  members,
  role,
  userId,
}: {
  groups: GroupRow[];
  members: MemberRow[];
  role: UserRole;
  userId: string;
}) {
  if (role === "admin") {
    return groups.map((group) => group.id);
  }

  if (role === "teacher") {
    return groups.filter((group) => group.teacher_id === userId).map((group) => group.id);
  }

  return members
    .filter((member) => member.user_id === userId && member.status === "active")
    .map((member) => member.group_id);
}

export default async function SessionsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={studentNavItems} title="Live sessions" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin live sessions ochiladi.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (
    profile.role !== "admin" &&
    profile.role !== "teacher" &&
    profile.role !== "support_teacher"
  ) {
    return (
      <AppShell
        navItems={navForRole(profile.role)}
        title="Live sessions"
        subtitle="Teacher yoki support teacher session boshqaradi."
      >
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Student quiz joining keyingi runtime stepda qo&apos;shiladi.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [groupsResult, membersResult, templatesResult, sessionsResult] = await Promise.all([
    admin.from("groups").select("id, name, teacher_id"),
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
    admin.from("quiz_templates").select("*").eq("status", "active"),
    admin.from("live_sessions").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const groups = (groupsResult.data ?? []) as GroupRow[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const visibleGroupIds = new Set(
    getVisibleGroupIds({
      groups,
      members,
      role: profile.role,
      userId: profile.id,
    }),
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const visibleTemplates = ((templatesResult.data ?? []) as TemplateRow[]).filter((template) => {
    if (profile.role === "admin") {
      return true;
    }

    return Boolean(template.group_id && visibleGroupIds.has(template.group_id));
  });
  const templateIds = visibleTemplates.map((template) => template.id);
  const templateQuestionsResult =
    templateIds.length > 0
      ? await admin
          .from("quiz_template_questions")
          .select("id, quiz_template_id, question_id, order_index, created_at")
          .in("quiz_template_id", templateIds)
      : { data: [] };
  const templateQuestions = (templateQuestionsResult.data ?? []) as TemplateQuestionRow[];
  const templates = visibleTemplates.map(
    (template): SessionTemplate => ({
      id: template.id,
      title: template.title,
      groupName: template.group_id
        ? groupsById.get(template.group_id)?.name ?? "Group topilmadi"
        : "Group yo'q",
      duration_minutes: template.duration_minutes,
      question_count_per_participant: template.question_count_per_participant,
      selectedQuestionCount: templateQuestions.filter(
        (item) => item.quiz_template_id === template.id,
      ).length,
    }),
  );
  const visibleSessions = ((sessionsResult.data ?? []) as SessionRow[]).filter((session) => {
    if (profile.role === "admin") {
      return true;
    }

    return Boolean(session.group_id && visibleGroupIds.has(session.group_id));
  });
  const sessionIds = visibleSessions.map((session) => session.id);
  const poolResult =
    sessionIds.length > 0
      ? await admin
          .from("session_question_pool")
          .select("id, session_id")
          .in("session_id", sessionIds)
      : { data: [] };
  const poolRows = (poolResult.data ?? []) as Pick<SessionPoolRow, "id" | "session_id">[];
  const sessions = visibleSessions.map(
    (session): LiveSessionRow => ({
      id: session.id,
      quiz_template_id: session.quiz_template_id,
      groupName: session.group_id
        ? groupsById.get(session.group_id)?.name ?? "Group topilmadi"
        : "Group yo'q",
      join_code: session.join_code,
      title_snapshot: session.title_snapshot,
      duration_minutes: session.duration_minutes,
      question_count_per_participant: session.question_count_per_participant,
      feedback_mode: session.feedback_mode,
      allow_guests: session.allow_guests,
      status: session.status,
      started_at: session.started_at,
      ends_at: session.ends_at,
      ended_at: session.ended_at,
      created_at: session.created_at,
      poolCount: poolRows.filter((row) => row.session_id === session.id).length,
    }),
  );
  const liveCount = sessions.filter((session) => session.status === "live").length;
  const waitingCount = sessions.filter((session) => session.status === "waiting").length;
  const endedCount = sessions.filter((session) => session.status === "ended").length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title="Live sessions"
      subtitle="Active quiz templatedan classroom waiting room yarating va manual start qiling."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Waiting" value={String(waitingCount)} hint="Start kutayotgan sessionlar." />
        <StatCard label="Live" value={String(liveCount)} hint="Hozir ishlayotgan sessionlar." />
        <StatCard label="Ended" value={String(endedCount)} hint="Yakunlangan sessionlar." />
      </div>

      <SessionsClient sessions={sessions} templates={templates} />
    </AppShell>
  );
}
