import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  GroupsClient,
  type GroupRow,
  type GroupsProfile,
  type LevelRow,
  type MemberRow,
  type ProfileRow,
} from "./groups-client";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];

type CurrentProfile = {
  id: string;
  role: UserRole;
  status: ProfileStatus;
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
  { href: "/quizzes", label: "Quiz builder" },
  { href: "/sessions", label: "Live sessions" },
];

async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();

  return profileData as CurrentProfile | null;
}

export default async function GroupsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    return (
      <AppShell navItems={teacherNavItems} title="Guruhlar" subtitle="Kirish kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Login qiling, keyin groups ochiladi.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (profile.role !== "admin" && profile.role !== "teacher") {
    return (
      <AppShell navItems={teacherNavItems} title="Guruhlar" subtitle="Teacher yoki admin kerak.">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Sizda group boshqarish huquqi yo&apos;q.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [levelsResult, profilesResult, groupsResult, membersResult] = await Promise.all([
    admin.from("levels").select("id, name, order_index").order("order_index"),
    admin
      .from("profiles")
      .select("id, full_name, role, status")
      .eq("status", "active")
      .order("full_name"),
    admin
      .from("groups")
      .select("id, name, level_id, teacher_id, invite_code, invite_enabled, status, created_at")
      .order("created_at", { ascending: false }),
    admin.from("group_members").select("id, group_id, user_id, role, status").eq("status", "active"),
  ]);

  const levels = (levelsResult.data ?? []) as LevelRow[];
  const activeProfiles = (profilesResult.data ?? []) as ProfileRow[];
  const allGroups = (groupsResult.data ?? []) as GroupRow[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const visibleGroups =
    profile.role === "admin"
      ? allGroups
      : allGroups.filter((group) => group.teacher_id === profile.id);
  const membersByGroup: Record<string, MemberRow[]> = {};

  for (const member of members) {
    membersByGroup[member.group_id] ??= [];
    membersByGroup[member.group_id].push(member);
  }

  const teachers = activeProfiles.filter((item) => item.role === "teacher");
  const addableUsers = activeProfiles.filter((item) =>
    ["student", "teacher", "support_teacher"].includes(item.role),
  );
  const navItems = profile.role === "admin" ? adminNavItems : teacherNavItems;

  return (
    <AppShell
      navItems={navItems}
      title="Guruhlar"
      subtitle="Teacher group yaratadi, invite code beradi, memberlarni boshqaradi."
    >
      <GroupsClient
        addableUsers={addableUsers}
        groups={visibleGroups}
        levels={levels}
        membersByGroup={membersByGroup}
        profile={profile as GroupsProfile}
        profiles={activeProfiles}
        teachers={teachers}
      />
    </AppShell>
  );
}
