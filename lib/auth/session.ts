import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { DASHBOARD_BY_ROLE, isDashboardRole } from "./roles";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "role" | "status"
>;

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, status")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    redirect("/auth/login");
  }

  return profile;
}

export async function redirectToRoleDashboard() {
  const profile = await requireProfile();

  if (!isDashboardRole(profile.role)) {
    redirect("/auth/login");
  }

  redirect(DASHBOARD_BY_ROLE[profile.role]);
}
