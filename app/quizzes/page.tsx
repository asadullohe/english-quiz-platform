import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  QuizzesClient,
  type QuizCategory,
  type QuizGroup,
  type QuizLevel,
  type QuizQuestion,
  type QuizTemplateRow,
} from "./quizzes-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  | "id"
  | "prompt"
  | "answer_type"
  | "visibility"
  | "source_group_id"
  | "level_id"
  | "category_id"
>;
type TemplateRow = Database["public"]["Tables"]["quiz_templates"]["Row"];
type TemplateQuestionRow = Database["public"]["Tables"]["quiz_template_questions"]["Row"];

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

function getVisibleGroups({
  groups,
  members,
  role,
  userId,
}: {
  groups: QuizGroup[];
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

  if (role === "support_teacher") {
    const groupIds = new Set(
      members
        .filter(
          (member) =>
            member.user_id === userId &&
            member.role === "support_teacher" &&
            member.status === "active",
        )
        .map((member) => member.group_id),
    );

    return groups.filter((group) => groupIds.has(group.id));
  }

  return [];
}

function canUseQuestion(question: QuestionRow, visibleGroupIds: Set<string>, role: UserRole) {
  if (role === "admin" || question.visibility === "public") {
    return true;
  }

  return Boolean(question.source_group_id && visibleGroupIds.has(question.source_group_id));
}

export default async function QuizzesPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={studentNavItems} title="Quiz builder" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin quiz builder ochiladi.
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
        title="Quiz builder"
        subtitle="Teacher yoki support teacher kerak."
      >
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Sizda quiz template yaratish huquqi yo&apos;q.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [
    groupsResult,
    membersResult,
    levelsResult,
    categoriesResult,
    questionsResult,
    templatesResult,
  ] = await Promise.all([
    admin.from("groups").select("id, name, teacher_id, status").eq("status", "active"),
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
    admin.from("levels").select("id, name, order_index").order("order_index"),
    admin.from("categories").select("id, name, order_index").order("order_index"),
    admin
      .from("questions")
      .select("id, prompt, answer_type, visibility, source_group_id, level_id, category_id")
      .eq("status", "approved")
      .limit(150),
    admin
      .from("quiz_templates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const allGroups = (groupsResult.data ?? []) as QuizGroup[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const visibleGroups = getVisibleGroups({
    groups: allGroups,
    members,
    role: profile.role,
    userId: profile.id,
  });
  const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
  const levels = (levelsResult.data ?? []) as QuizLevel[];
  const categories = (categoriesResult.data ?? []) as QuizCategory[];
  const levelsById = new Map(levels.map((level) => [level.id, level]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const groupsById = new Map(allGroups.map((group) => [group.id, group]));
  const questions = ((questionsResult.data ?? []) as QuestionRow[])
    .filter((question) => canUseQuestion(question, visibleGroupIds, profile.role))
    .map(
      (question): QuizQuestion => ({
        id: question.id,
        prompt: question.prompt,
        answer_type: question.answer_type,
        visibility: question.visibility,
        groupName: question.source_group_id
          ? groupsById.get(question.source_group_id)?.name ?? "Group topilmadi"
          : "Group yo'q",
        levelName: question.level_id
          ? levelsById.get(question.level_id)?.name ?? "Level topilmadi"
          : "Level yo'q",
        categoryName: question.category_id
          ? categoriesById.get(question.category_id)?.name ?? "Category topilmadi"
          : "Category yo'q",
      }),
    );
  const rawTemplates = ((templatesResult.data ?? []) as TemplateRow[]).filter((template) => {
    if (profile.role === "admin") {
      return true;
    }

    return Boolean(template.group_id && visibleGroupIds.has(template.group_id));
  });
  const templateIds = rawTemplates.map((template) => template.id);
  const templateQuestionsResult =
    templateIds.length > 0
      ? await admin
          .from("quiz_template_questions")
          .select("id, quiz_template_id, question_id, order_index, created_at")
          .in("quiz_template_id", templateIds)
      : { data: [] };
  const templateQuestions = (templateQuestionsResult.data ?? []) as TemplateQuestionRow[];
  const templates = rawTemplates.map(
    (template): QuizTemplateRow => ({
      id: template.id,
      title: template.title,
      description: template.description,
      group_id: template.group_id,
      question_count_per_participant: template.question_count_per_participant,
      duration_minutes: template.duration_minutes,
      feedback_mode: template.feedback_mode,
      allow_guests: template.allow_guests,
      status: template.status,
      created_at: template.created_at,
      selectedQuestionCount: templateQuestions.filter(
        (item) => item.quiz_template_id === template.id,
      ).length,
    }),
  );
  const activeCount = templates.filter((template) => template.status === "active").length;
  const draftCount = templates.filter((template) => template.status === "draft").length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title="Quiz builder"
      subtitle="Approved savollardan reusable classroom quiz template yarating."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Templates" value={String(templates.length)} hint="Visible quiz template." />
        <StatCard label="Active" value={String(activeCount)} hint="Live sessionga tayyor." />
        <StatCard label="Draft" value={String(draftCount)} hint="Hali tayyorlanayotgan quizlar." />
      </div>

      <QuizzesClient
        categories={categories}
        groups={visibleGroups}
        levels={levels}
        questions={questions}
        templates={templates}
      />
    </AppShell>
  );
}
