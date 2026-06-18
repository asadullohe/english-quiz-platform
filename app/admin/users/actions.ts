"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type UserStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type RoleStatus = Pick<Database["public"]["Tables"]["profiles"]["Row"], "role" | "status">;

const USER_ROLES = new Set<UserRole>(["student", "teacher", "support_teacher", "admin"]);
const USER_STATUSES = new Set<UserStatus>(["active", "disabled"]);

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithParams(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/admin/users?${searchParams.toString()}`);
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as RoleStatus | null;

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    redirect("/dashboard");
  }

  return user;
}

export async function createUserAction(formData: FormData) {
  await requireAdminUser();

  const fullName = getFormString(formData, "full_name");
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");
  const role = getFormString(formData, "role") as UserRole;

  if (!fullName || !email || !password || !USER_ROLES.has(role)) {
    redirectWithParams({ error: "Ism, email, parol va role to'g'ri kiriting." });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    redirectWithParams({ error: error?.message ?? "User yaratilmadi." });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    role,
    status: "active",
  });

  if (profileError) {
    redirectWithParams({ error: profileError.message });
  }

  revalidatePath("/admin/users");
  redirectWithParams({ message: "User yaratildi." });
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAdminUser();

  const userId = getFormString(formData, "user_id");
  const role = getFormString(formData, "role") as UserRole;
  const status = getFormString(formData, "status") as UserStatus;

  if (!userId || !USER_ROLES.has(role) || !USER_STATUSES.has(status)) {
    redirectWithParams({ error: "Role yoki status noto'g'ri." });
  }

  if (userId === currentUser.id && (role !== "admin" || status !== "active")) {
    redirectWithParams({ error: "O'zingizni admin paneldan chiqarib bo'lmaydi." });
  }

  const admin = createAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);

    if (authError || !authUser.user?.email) {
      redirectWithParams({ error: authError?.message ?? "Auth user topilmadi." });
    }

    const fallbackName = authUser.user.email.split("@")[0] ?? "User";
    const { error: insertError } = await admin.from("profiles").insert({
      id: userId,
      full_name: fallbackName,
      role,
      status,
    });

    if (insertError) {
      redirectWithParams({ error: insertError.message });
    }
  } else {
    const { error } = await admin.from("profiles").update({ role, status }).eq("id", userId);

    if (error) {
      redirectWithParams({ error: error.message });
    }
  }

  revalidatePath("/admin/users");
  redirectWithParams({ message: "User yangilandi." });
}
