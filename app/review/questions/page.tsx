import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  ReviewQuestionsClient,
  type ReviewOption,
  type ReviewQuestion,
  type ReviewTextAnswer,
} from "./review-questions-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  | "id"
  | "created_by_user_id"
  | "source_assignment_id"
  | "source_group_id"
  | "answer_type"
  | "prompt"
  | "explanation"
  | "created_at"
  | "status"
>;
type GroupRow = Pick<Database["public"]["Tables"]["groups"]["Row"], "id" | "name" | "teacher_id">;
type MemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name">;
type AssignmentRow = Pick<
  Database["public"]["Tables"]["question_assignments"]["Row"],
  "id" | "title"
>;
type TagRow = Database["public"]["Tables"]["question_tags"]["Row"];

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

const supportNavItems = [
  { href: "/groups", label: "Assigned groups" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/review/reports", label: "Reports" },
];

const studentNavItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
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

  if (role === "support_teacher") {
    return members
      .filter(
        (member) =>
          member.user_id === userId &&
          member.role === "support_teacher" &&
          member.status === "active",
      )
      .map((member) => member.group_id);
  }

  return [];
}

function toReviewQuestions({
  assignmentsById,
  groupsById,
  options,
  profilesById,
  questions,
  tags,
  textAnswers,
}: {
  assignmentsById: Map<string, AssignmentRow>;
  groupsById: Map<string, GroupRow>;
  options: ReviewOption[];
  profilesById: Map<string, ProfileRow>;
  questions: QuestionRow[];
  tags: TagRow[];
  textAnswers: ReviewTextAnswer[];
}): ReviewQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation,
    answer_type: question.answer_type,
    created_at: question.created_at,
    creatorName: profilesById.get(question.created_by_user_id)?.full_name ?? "Student topilmadi",
    groupName: question.source_group_id
      ? groupsById.get(question.source_group_id)?.name ?? "Group topilmadi"
      : "Group yo'q",
    assignmentTitle: question.source_assignment_id
      ? assignmentsById.get(question.source_assignment_id)?.title ?? "Assignment topilmadi"
      : "Assignment yo'q",
    tags: tags.filter((tag) => tag.question_id === question.id).map((tag) => tag.tag),
    options: options.filter((option) => option.question_id === question.id),
    textAnswers: textAnswers.filter((answer) => answer.question_id === question.id),
  }));
}

export default async function ReviewQuestionsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={studentNavItems} title="Savollar review" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin review queue ochiladi.
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
        title="Savollar review"
        subtitle="Teacher yoki support teacher kerak."
      >
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Sizda savollarni review qilish huquqi yo&apos;q.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [groupsResult, membersResult] = await Promise.all([
    admin.from("groups").select("id, name, teacher_id"),
    admin.from("group_members").select("id, group_id, user_id, role, joined_at, status"),
  ]);
  const groups = (groupsResult.data ?? []) as GroupRow[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const visibleGroupIds = getVisibleGroupIds({
    groups,
    members,
    role: profile.role,
    userId: profile.id,
  });
  const pendingQuestionsResult =
    visibleGroupIds.length > 0
      ? await admin
          .from("questions")
          .select(
            "id, created_by_user_id, source_assignment_id, source_group_id, answer_type, prompt, explanation, created_at, status",
          )
          .eq("status", "pending_review")
          .in("source_group_id", visibleGroupIds)
          .order("created_at", { ascending: true })
      : { data: [] };
  const rawQuestions = (pendingQuestionsResult.data ?? []) as QuestionRow[];
  const questions =
    profile.role === "support_teacher"
      ? rawQuestions.filter((question) => question.created_by_user_id !== profile.id)
      : rawQuestions;
  const questionIds = questions.map((question) => question.id);
  const creatorIds = Array.from(new Set(questions.map((question) => question.created_by_user_id)));
  const assignmentIds = Array.from(
    new Set(
      questions
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

  const profilesById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((item) => [item.id, item]),
  );
  const assignmentsById = new Map(
    ((assignmentsResult.data ?? []) as AssignmentRow[]).map((item) => [item.id, item]),
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const reviewQuestions = toReviewQuestions({
    assignmentsById,
    groupsById,
    options: (optionsResult.data ?? []) as ReviewOption[],
    profilesById,
    questions,
    tags: (tagsResult.data ?? []) as TagRow[],
    textAnswers: (textAnswersResult.data ?? []) as ReviewTextAnswer[],
  });
  const singleChoiceCount = reviewQuestions.filter(
    (question) => question.answer_type === "single_choice",
  ).length;
  const textCount = reviewQuestions.filter((question) => question.answer_type === "text").length;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title="Savollar review"
      subtitle="Student submissions approve, needs changes yoki reject qilinadi."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending" value={String(reviewQuestions.length)} hint="Review kutayotgan savollar." />
        <StatCard label="Single choice" value={String(singleChoiceCount)} hint="Variantli savollar." />
        <StatCard label="Text answer" value={String(textCount)} hint="Yozma javobli savollar." />
      </div>

      <ReviewQuestionsClient questions={reviewQuestions} />
    </AppShell>
  );
}
