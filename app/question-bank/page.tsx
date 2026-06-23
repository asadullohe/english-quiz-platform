import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  QuestionBankClient,
  type BankOption,
  type BankQuestion,
  type BankTextAnswer,
} from "./question-bank-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  | "id"
  | "created_by_user_id"
  | "source_assignment_id"
  | "source_group_id"
  | "level_id"
  | "category_id"
  | "answer_type"
  | "prompt"
  | "explanation"
  | "image_asset_id"
  | "audio_asset_id"
  | "visibility"
  | "approved_at"
>;
type GroupRow = Pick<Database["public"]["Tables"]["groups"]["Row"], "id" | "name" | "teacher_id">;
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name">;
type AssignmentRow = Pick<
  Database["public"]["Tables"]["question_assignments"]["Row"],
  "id" | "title"
>;
type LevelRow = Pick<Database["public"]["Tables"]["levels"]["Row"], "id" | "name">;
type CategoryRow = Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "name">;
type TagRow = Database["public"]["Tables"]["question_tags"]["Row"];

type QuestionBankPageProps = {
  searchParams?: Promise<{
    category?: string;
    level?: string;
    q?: string;
    visibility?: string;
  }>;
};

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

function isVisibleQuestion({
  question,
  role,
  userId,
  visibleGroupIds,
}: {
  question: QuestionRow;
  role: UserRole;
  userId: string;
  visibleGroupIds: Set<string>;
}) {
  if (role === "admin") {
    return true;
  }

  if (question.visibility === "public") {
    return true;
  }

  if (question.created_by_user_id === userId) {
    return true;
  }

  return Boolean(question.source_group_id && visibleGroupIds.has(question.source_group_id));
}

function matchesQuery(question: BankQuestion, query: string) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();

  return (
    question.prompt.toLowerCase().includes(normalized) ||
    question.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
    question.assignmentTitle.toLowerCase().includes(normalized)
  );
}

function toBankQuestions({
  assignmentsById,
  categoriesById,
  groupsById,
  levelsById,
  options,
  profilesById,
  questions,
  tags,
  textAnswers,
  userId,
}: {
  assignmentsById: Map<string, AssignmentRow>;
  categoriesById: Map<string, CategoryRow>;
  groupsById: Map<string, GroupRow>;
  levelsById: Map<string, LevelRow>;
  options: BankOption[];
  profilesById: Map<string, ProfileRow>;
  questions: QuestionRow[];
  tags: TagRow[];
  textAnswers: BankTextAnswer[];
  userId: string;
}): BankQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation,
    answer_type: question.answer_type,
    visibility: question.visibility,
    levelName: question.level_id
      ? levelsById.get(question.level_id)?.name ?? "Level topilmadi"
      : "Level yo'q",
    categoryName: question.category_id
      ? categoriesById.get(question.category_id)?.name ?? "Category topilmadi"
      : "Category yo'q",
    groupName: question.source_group_id
      ? groupsById.get(question.source_group_id)?.name ?? "Group topilmadi"
      : "Group yo'q",
    assignmentTitle: question.source_assignment_id
      ? assignmentsById.get(question.source_assignment_id)?.title ?? "Assignment topilmadi"
      : "Assignment yo'q",
    creatorName:
      question.created_by_user_id === userId
        ? "Siz"
        : profilesById.get(question.created_by_user_id)?.full_name ?? "Anonymous",
    approvedAt: question.approved_at,
    hasImage: Boolean(question.image_asset_id),
    hasAudio: Boolean(question.audio_asset_id),
    isOwn: question.created_by_user_id === userId,
    tags: tags.filter((tag) => tag.question_id === question.id).map((tag) => tag.tag),
    options: options.filter((option) => option.question_id === question.id),
    textAnswers: textAnswers.filter((answer) => answer.question_id === question.id),
  }));
}

export default async function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
  const profile = await getCurrentProfile();
  const params = await searchParams;

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={studentNavItems} title="Question bank" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin approved savollar ochiladi.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const filters = {
    categoryId: params?.category ?? "",
    levelId: params?.level ?? "",
    query: params?.q?.trim() ?? "",
    visibility:
      params?.visibility === "public" || params?.visibility === "group_only"
        ? params.visibility
        : "",
  };
  const admin = createAdminClient();
  const [levelsResult, categoriesResult, groupsResult, membersResult] = await Promise.all([
    admin.from("levels").select("id, name, order_index").order("order_index"),
    admin.from("categories").select("id, name, order_index").order("order_index"),
    admin.from("groups").select("id, name, teacher_id"),
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
  ]);
  const levels = (levelsResult.data ?? []) as LevelRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
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

  let questionQuery = admin
    .from("questions")
    .select(
      "id, created_by_user_id, source_assignment_id, source_group_id, level_id, category_id, answer_type, prompt, explanation, image_asset_id, audio_asset_id, visibility, approved_at",
    )
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(100);

  if (filters.levelId) {
    questionQuery = questionQuery.eq("level_id", filters.levelId);
  }

  if (filters.categoryId) {
    questionQuery = questionQuery.eq("category_id", filters.categoryId);
  }

  if (filters.visibility) {
    questionQuery = questionQuery.eq("visibility", filters.visibility);
  }

  const questionsResult = await questionQuery;
  const rawQuestions = ((questionsResult.data ?? []) as QuestionRow[]).filter((question) =>
    isVisibleQuestion({
      question,
      role: profile.role,
      userId: profile.id,
      visibleGroupIds,
    }),
  );
  const questionIds = rawQuestions.map((question) => question.id);
  const creatorIds = Array.from(
    new Set(rawQuestions.map((question) => question.created_by_user_id)),
  );
  const assignmentIds = Array.from(
    new Set(
      rawQuestions
        .map((question) => question.source_assignment_id)
        .filter((assignmentId): assignmentId is string => Boolean(assignmentId)),
    ),
  );

  const [profilesResult, assignmentsResult, optionsResult, textAnswersResult, tagsResult] =
    await Promise.all([
      creatorIds.length > 0
        ? admin.from("profiles").select("id, full_name").in("id", creatorIds)
        : { data: [] },
      assignmentIds.length > 0
        ? admin.from("question_assignments").select("id, title").in("id", assignmentIds)
        : { data: [] },
      questionIds.length > 0
        ? admin
            .from("question_options")
            .select("id, question_id, text, is_correct, order_index")
            .in("question_id", questionIds)
        : { data: [] },
      questionIds.length > 0
        ? admin
            .from("question_text_answers")
            .select("id, question_id, answer_text")
            .in("question_id", questionIds)
        : { data: [] },
      questionIds.length > 0
        ? admin.from("question_tags").select("id, question_id, tag").in("question_id", questionIds)
        : { data: [] },
    ]);

  const bankQuestions = toBankQuestions({
    assignmentsById: new Map(
      ((assignmentsResult.data ?? []) as AssignmentRow[]).map((item) => [item.id, item]),
    ),
    categoriesById: new Map(categories.map((category) => [category.id, category])),
    groupsById: new Map(groups.map((group) => [group.id, group])),
    levelsById: new Map(levels.map((level) => [level.id, level])),
    options: (optionsResult.data ?? []) as BankOption[],
    profilesById: new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((item) => [item.id, item]),
    ),
    questions: rawQuestions,
    tags: (tagsResult.data ?? []) as TagRow[],
    textAnswers: (textAnswersResult.data ?? []) as BankTextAnswer[],
    userId: profile.id,
  }).filter((question) => matchesQuery(question, filters.query));
  const publicCount = bankQuestions.filter((question) => question.visibility === "public").length;
  const groupOnlyCount = bankQuestions.filter(
    (question) => question.visibility === "group_only",
  ).length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title="Question bank"
      subtitle="Approved savollar quiz builder va self practice uchun qayta ishlatiladi."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Approved" value={String(bankQuestions.length)} hint="Filterdan keyingi savollar." />
        <StatCard label="Public" value={String(publicCount)} hint="Public bankdagi savollar." />
        <StatCard label="Group only" value={String(groupOnlyCount)} hint="Group ichidagi savollar." />
      </div>

      <QuestionBankClient
        categories={categories}
        filters={filters}
        levels={levels}
        questions={bankQuestions}
      />
    </AppShell>
  );
}
