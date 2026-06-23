import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { UsersClient, type AdminUserRow } from "./users-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type UserStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "role" | "status" | "created_at"
>;
type RoleStatus = Pick<Database["public"]["Tables"]["profiles"]["Row"], "role" | "status">;

const navItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/groups", label: "All groups" },
  { href: "/review/reports", label: "Moderation" },
];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  const profile = profileData as RoleStatus | null;

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return null;
  }

  return user;
}

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin();

  if (!currentUser) {
    return (
      <AppShell
        navItems={navItems}
        title="Users"
        subtitle="Bu sahifa faqat active admin uchun."
      >
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Admin role bilan kirish kerak.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [{ data: authUsersData }, { data: profilesData }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, full_name, role, status, created_at").order("created_at", {
      ascending: false,
    }),
  ]);

  const profiles = (profilesData ?? []) as Profile[];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const rows: AdminUserRow[] = (authUsersData.users ?? []).map((user) => {
    const profile = profilesById.get(user.id);

    return {
      id: user.id,
      email: user.email ?? "No email",
      fullName: profile?.full_name ?? "Profile yo'q",
      role: (profile?.role ?? "student") as UserRole,
      status: (profile?.status ?? "active") as UserStatus,
      createdAt: profile?.created_at ?? user.created_at,
      hasProfile: Boolean(profile),
      isCurrentUser: user.id === currentUser.id,
    };
  });

  return (
    <AppShell
      navItems={navItems}
      title="Users"
      subtitle="Admin user yaratadi, role beradi, disabled qiladi."
    >
      <UsersClient rows={rows} />
    </AppShell>
  );
}
