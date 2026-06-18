import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createUserAction, updateUserAction } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type UserStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "role" | "status" | "created_at"
>;
type RoleStatus = Pick<Database["public"]["Tables"]["profiles"]["Row"], "role" | "status">;

type AdminUsersPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

const navItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/groups", label: "All groups" },
  { href: "/review/reports", label: "Moderation" },
];

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "support_teacher", label: "Support teacher" },
  { value: "admin", label: "Admin" },
];

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
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

function SelectField({
  defaultValue,
  form,
  name,
  options,
}: {
  defaultValue: string;
  form?: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
      defaultValue={defaultValue}
      form={form}
      name={name}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const [params, currentUser] = await Promise.all([searchParams, requireAdmin()]);

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
  const rows = (authUsersData.users ?? []).map((user) => {
    const profile = profilesById.get(user.id);

    return {
      id: user.id,
      email: user.email ?? "No email",
      fullName: profile?.full_name ?? "Profile yo'q",
      role: profile?.role ?? "student",
      status: profile?.status ?? "active",
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
      {params?.error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {params.error}
        </p>
      ) : null}
      {params?.message ? (
        <p className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          {params.message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Yangi user</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_180px_auto]">
            <Input name="full_name" placeholder="Ism familiya" required />
            <Input name="email" placeholder="Email" required type="email" />
            <Input minLength={6} name="password" placeholder="Vaqtinchalik parol" required />
            <SelectField defaultValue="teacher" name="role" options={roleOptions} />
            <Button type="submit">Yaratish</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr className="border-b last:border-0" key={user.id}>
                    {(() => {
                      const formId = `user-${user.id}`;

                      return (
                        <>
                    <td className="py-4 pr-4">
                      <p className="font-bold">{user.fullName}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                      {!user.hasProfile ? (
                        <p className="mt-1 text-xs font-semibold text-destructive">
                          Profile yo&apos;q. Save bosilsa tiklanadi.
                        </p>
                      ) : null}
                      {user.isCurrentUser ? (
                        <p className="mt-1 text-xs font-semibold text-primary">Siz</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <SelectField
                        defaultValue={user.role}
                        form={formId}
                        name="role"
                        options={roleOptions}
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <SelectField
                        defaultValue={user.status}
                        form={formId}
                        name="status"
                        options={statusOptions}
                      />
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td className="py-4 pr-4">
                      <form action={updateUserAction} id={formId}>
                        <input name="user_id" type="hidden" value={user.id} />
                      </form>
                      <Button form={formId} size="sm" type="submit">
                        Save
                      </Button>
                    </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
