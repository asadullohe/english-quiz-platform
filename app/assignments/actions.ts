"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type AssignmentStatus =
  Database["public"]["Tables"]["question_assignments"]["Row"]["status"];

type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

const ASSIGNMENT_STATUSES = new Set<AssignmentStatus>([
  "open",
  "reviewing",
  "ready",
  "used",
  "archived",
]);

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireActiveProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as CurrentProfile | null;

  if (!profile || profile.status !== "active") {
    redirect("/auth/login");
  }

  return profile;
}

async function canCreateForGroup(groupId: string, profile: CurrentProfile) {
  if (profile.role === "admin") {
    return true;
  }

  const admin = createAdminClient();

  if (profile.role === "teacher") {
    const { data: group } = await admin
      .from("groups")
      .select("id, teacher_id, status")
      .eq("id", groupId)
      .maybeSingle();

    return group?.status === "active" && group.teacher_id === profile.id;
  }

  if (profile.role === "support_teacher") {
    const { data: member } = await admin
      .from("group_members")
      .select("id, role, status")
      .eq("group_id", groupId)
      .eq("user_id", profile.id)
      .eq("role", "support_teacher")
      .maybeSingle();

    return member?.status === "active";
  }

  return false;
}

function parseDeadline(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export async function createAssignmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const groupId = getFormString(formData, "group_id");
  const title = getFormString(formData, "title");
  const topic = getFormString(formData, "topic");
  const levelId = getFormString(formData, "level_id") || null;
  const categoryId = getFormString(formData, "category_id") || null;
  const questionsPerStudent = Number(getFormString(formData, "questions_per_student"));
  const deadline = parseDeadline(getFormString(formData, "deadline_at"));
  const shareApprovedToPublicBank = getFormString(formData, "share_public") === "true";

  if (!groupId || !title || !topic) {
    return actionError("Group, title va topic kiriting.");
  }

  if (!Number.isInteger(questionsPerStudent) || questionsPerStudent < 1) {
    return actionError("Har student uchun savollar soni 1 yoki undan katta bo'lishi kerak.");
  }

  if (deadline === undefined) {
    return actionError("Deadline formati noto'g'ri.");
  }

  if (!(await canCreateForGroup(groupId, profile))) {
    return actionError("Bu group uchun assignment yaratish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("question_assignments").insert({
    group_id: groupId,
    created_by_user_id: profile.id,
    title,
    topic,
    level_id: levelId,
    category_id: categoryId,
    questions_per_student: questionsPerStudent,
    deadline_at: deadline,
    share_approved_to_public_bank: shareApprovedToPublicBank,
    status: "open",
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/assignments");
  return actionSuccess("Assignment yaratildi.");
}

export async function updateAssignmentStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const assignmentId = getFormString(formData, "assignment_id");
  const status = getFormString(formData, "status") as AssignmentStatus;

  if (!assignmentId || !ASSIGNMENT_STATUSES.has(status)) {
    return actionError("Assignment status form noto'g'ri.");
  }

  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("question_assignments")
    .select("id, group_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) {
    return actionError("Assignment topilmadi.");
  }

  if (!(await canCreateForGroup(assignment.group_id, profile))) {
    return actionError("Bu assignmentni o'zgartirish huquqi yo'q.");
  }

  const { error } = await admin
    .from("question_assignments")
    .update({ status })
    .eq("id", assignmentId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/assignments");
  return actionSuccess("Assignment status yangilandi.");
}
