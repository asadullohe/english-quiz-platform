"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
};

const GROUP_STATUSES = new Set(["active", "archived"]);
const MEMBER_ROLES = new Set(["student", "teacher", "support_teacher"]);

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function requireGroupManager() {
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

  if (profile.role !== "admin" && profile.role !== "teacher") {
    redirect("/dashboard");
  }

  return profile;
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

async function canManageGroup(groupId: string, profile: CurrentProfile) {
  if (profile.role === "admin") {
    return true;
  }

  const admin = createAdminClient();
  const { data: group } = await admin
    .from("groups")
    .select("teacher_id")
    .eq("id", groupId)
    .maybeSingle();

  return group?.teacher_id === profile.id;
}

export async function createGroupAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireGroupManager();
  const admin = createAdminClient();

  const name = getFormString(formData, "name");
  const levelId = getFormString(formData, "level_id") || null;
  const selectedTeacherId = getFormString(formData, "teacher_id");
  const teacherId = profile.role === "admin" && selectedTeacherId ? selectedTeacherId : profile.id;

  if (!name) {
    return actionError("Group nomini kiriting.");
  }

  const { data: teacher } = await admin
    .from("profiles")
    .select("id, role, status")
    .eq("id", teacherId)
    .maybeSingle();

  if (!teacher || teacher.status !== "active" || teacher.role !== "teacher") {
    return actionError("Active teacher tanlang.");
  }

  let insertError: { message: string } | null = null;
  let groupId = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from("groups")
      .insert({
        name,
        level_id: levelId,
        teacher_id: teacherId,
        invite_code: makeInviteCode(),
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      groupId = data.id;
      insertError = null;
      break;
    }

    insertError = error;
  }

  if (insertError || !groupId) {
    return actionError(insertError?.message ?? "Group yaratilmadi.");
  }

  await admin.from("group_members").upsert({
    group_id: groupId,
    user_id: teacherId,
    role: "teacher",
    status: "active",
  });

  revalidatePath("/groups");
  return actionSuccess("Group yaratildi.");
}

export async function updateGroupAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireGroupManager();
  const groupId = getFormString(formData, "group_id");
  const name = getFormString(formData, "name");
  const levelId = getFormString(formData, "level_id") || null;
  const status = getFormString(formData, "status");
  const inviteEnabled = getFormString(formData, "invite_enabled") === "true";

  if (!groupId || !name || !GROUP_STATUSES.has(status)) {
    return actionError("Group form noto'g'ri.");
  }

  if (!(await canManageGroup(groupId, profile))) {
    return actionError("Bu groupni boshqarish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("groups")
    .update({
      name,
      level_id: levelId,
      status,
      invite_enabled: inviteEnabled,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", groupId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/groups");
  return actionSuccess("Group yangilandi.");
}

export async function regenerateInviteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireGroupManager();
  const groupId = getFormString(formData, "group_id");

  if (!groupId) {
    return actionError("Group topilmadi.");
  }

  if (!(await canManageGroup(groupId, profile))) {
    return actionError("Bu groupni boshqarish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("groups")
    .update({ invite_code: makeInviteCode(), invite_enabled: true })
    .eq("id", groupId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/groups");
  return actionSuccess("Invite code yangilandi.");
}

export async function addMemberAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireGroupManager();
  const groupId = getFormString(formData, "group_id");
  const userId = getFormString(formData, "user_id");
  const role = getFormString(formData, "role");

  if (!groupId || !userId || !MEMBER_ROLES.has(role)) {
    return actionError("Member form noto'g'ri.");
  }

  if (!(await canManageGroup(groupId, profile))) {
    return actionError("Bu groupni boshqarish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { data: userProfile } = await admin
    .from("profiles")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!userProfile || userProfile.status !== "active") {
    return actionError("Active user tanlang.");
  }

  if (role === "student" && userProfile.role !== "student") {
    return actionError("Student role uchun student user tanlang.");
  }

  if (role === "support_teacher" && userProfile.role !== "support_teacher") {
    return actionError("Support role uchun support teacher tanlang.");
  }

  if (role === "teacher" && userProfile.role !== "teacher") {
    return actionError("Teacher role uchun teacher user tanlang.");
  }

  const { error } = await admin.from("group_members").upsert({
    group_id: groupId,
    user_id: userId,
    role,
    status: "active",
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/groups");
  return actionSuccess("Member qo'shildi.");
}

export async function removeMemberAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireGroupManager();
  const memberId = getFormString(formData, "member_id");
  const groupId = getFormString(formData, "group_id");

  if (!memberId || !groupId) {
    return actionError("Member topilmadi.");
  }

  if (!(await canManageGroup(groupId, profile))) {
    return actionError("Bu groupni boshqarish huquqi yo'q.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("group_members")
    .update({ status: "removed" })
    .eq("id", memberId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/groups");
  return actionSuccess("Member olib tashlandi.");
}

export async function joinGroupByInviteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireActiveProfile();
  const inviteCode = getFormString(formData, "invite_code").toUpperCase();

  if (profile.role !== "student") {
    return actionError("Invite code orqali faqat student qo'shiladi.");
  }

  if (!inviteCode) {
    return actionError("Invite code kiriting.");
  }

  const admin = createAdminClient();
  const { data: group, error: groupError } = await admin
    .from("groups")
    .select("id, name, invite_enabled, status")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (groupError) {
    return actionError(groupError.message);
  }

  if (!group || group.status !== "active" || !group.invite_enabled) {
    return actionError("Invite code topilmadi yoki yopilgan.");
  }

  const { data: existingMember } = await admin
    .from("group_members")
    .select("id, role, status")
    .eq("group_id", group.id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingMember?.status === "active") {
    return actionSuccess(`Siz allaqachon ${group.name} groupidasiz.`);
  }

  if (existingMember && existingMember.role !== "student") {
    return actionError("Bu groupda siz uchun boshqa role biriktirilgan.");
  }

  const { error } = await admin.from("group_members").upsert({
    group_id: group.id,
    user_id: profile.id,
    role: "student",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard/student");
  revalidatePath(`/groups/${group.id}`);
  return actionSuccess(`${group.name} groupiga qo'shildingiz.`);
}
