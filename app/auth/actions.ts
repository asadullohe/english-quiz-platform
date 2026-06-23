"use server";

import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_BY_ROLE, isDashboardRole } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/database.types";

type LoginProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role" | "status"
>;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function mapAuthError(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email yoki parol noto'g'ri.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email hali tasdiqlanmagan. Inboxni tekshiring.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Bu email bilan account allaqachon yaratilgan.";
  }

  if (normalized.includes("password")) {
    return "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
  }

  return message;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  if (!email || !password) {
    return actionError("Email va parolni kiriting.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return actionError(mapAuthError(error?.message, "Kirishda xatolik yuz berdi."));
  }

  const user = data.user;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as LoginProfile | null;

  if (!profile) {
    await supabase.auth.signOut();
    return actionError("Bu user uchun profile topilmadi.");
  }

  if (profile.status !== "active" || !isDashboardRole(profile.role)) {
    await supabase.auth.signOut();
    return actionError("Bu account platformaga kirish uchun faol emas.");
  }

  redirect(DASHBOARD_BY_ROLE[profile.role]);
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = getFormString(formData, "full_name");
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  if (!fullName || !email || !password) {
    return actionError("Ism familiya, email va parolni kiriting.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return actionError(mapAuthError(error.message, "Ro'yxatdan o'tishda xatolik yuz berdi."));
  }

  if (!data.session) {
    return actionSuccess("Account yaratildi. Email tasdiqlash kerak bo'lsa, inboxni tekshiring.");
  }

  redirect("/dashboard/student");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
