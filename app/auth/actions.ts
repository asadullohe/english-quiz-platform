"use server";

import { redirect } from "next/navigation";
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

function redirectWithParams(path: string, params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`${path}?${searchParams.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  if (!email || !password) {
    redirectWithParams("/auth/login", {
      error: "Email va parolni kiriting.",
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirectWithParams("/auth/login", {
      error: error?.message ?? "Kirishda xatolik yuz berdi.",
    });
  }

  const user = data.user;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as LoginProfile | null;

  if (!profile) {
    redirectWithParams("/auth/login", {
      error: "Bu user uchun profile topilmadi.",
    });
  }

  if (profile.status !== "active" || !isDashboardRole(profile.role)) {
    redirectWithParams("/auth/login", {
      error: "Bu account platformaga kirish uchun faol emas.",
    });
  }

  redirect(DASHBOARD_BY_ROLE[profile.role]);
}

export async function registerAction(formData: FormData) {
  const fullName = getFormString(formData, "full_name");
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  if (!fullName || !email || !password) {
    redirectWithParams("/auth/register", {
      error: "Ism familiya, email va parolni kiriting.",
    });
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
    redirectWithParams("/auth/register", {
      error: error.message,
    });
  }

  if (!data.session) {
    redirectWithParams("/auth/login", {
      message: "Account yaratildi. Email tasdiqlash kerak bo'lsa, inboxni tekshiring.",
    });
  }

  redirect("/dashboard/student");
}
