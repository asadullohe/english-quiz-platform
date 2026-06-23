import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const studentNavItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/sessions", label: "Live quizlar" },
  { href: "/self-practice", label: "Self practice" },
];

const supportNavItems = [
  { href: "/groups", label: "Assigned groups" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/review/reports", label: "Reports" },
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
  const activeMemberships = members.filter((member) => member.user_id === profile.id);
  const visibleGroups =
    profile.role === "admin"
      ? allGroups
      : profile.role === "teacher"
        ? allGroups.filter((group) => group.teacher_id === profile.id)
        : allGroups.filter((group) =>
            activeMemberships.some((member) => member.group_id === group.id),
          );
  const membersByGroup: Record<string, MemberRow[]> = {};

  for (const member of members) {
    membersByGroup[member.group_id] ??= [];
    membersByGroup[member.group_id].push(member);
  }

  const teachers = activeProfiles.filter((item) => item.role === "teacher");
  const addableUsers = activeProfiles.filter((item) =>
    ["student", "teacher", "support_teacher"].includes(item.role),
  );
  const navItems =
    profile.role === "admin"
      ? adminNavItems
      : profile.role === "teacher"
        ? teacherNavItems
        : profile.role === "support_teacher"
          ? supportNavItems
          : studentNavItems;

  if (profile.role !== "admin" && profile.role !== "teacher") {
    return (
      <AppShell
        navItems={navItems}
        title={profile.role === "student" ? "Mening guruhlarim" : "Assigned groups"}
        subtitle="Classroom group, memberlar va keyingi topshiriqlar uchun markaz."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active groups" value={String(visibleGroups.length)} hint="Siz a'zo bo'lgan group." />
          <StatCard
            label="Studentlar"
            value={String(
              visibleGroups.reduce(
                (total, group) =>
                  total +
                  (membersByGroup[group.id] ?? []).filter((member) => member.role === "student")
                    .length,
                0,
              ),
            )}
            hint="Ko'rinadigan grouplardagi studentlar."
          />
          <StatCard
            label="Support"
            value={String(
              visibleGroups.reduce(
                (total, group) =>
                  total +
                  (membersByGroup[group.id] ?? []).filter(
                    (member) => member.role === "support_teacher",
                  ).length,
                0,
              ),
            )}
            hint="Reviewga yordam beradigan teacherlar."
          />
        </div>

        {profile.role === "student" ? (
          <Card>
            <CardHeader>
              <CardTitle>Invite code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Teacher bergan code bilan yangi groupga qo&apos;shiling.</p>
              <Button asChild>
                <Link href="/groups/join">Groupga qo&apos;shilish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4">
          {visibleGroups.map((group) => {
            const teacherName = activeProfiles.find((item) => item.id === group.teacher_id)?.full_name;
            const levelName = levels.find((item) => item.id === group.level_id)?.name ?? "Level yo'q";
            const groupMembers = membersByGroup[group.id] ?? [];

            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {teacherName ?? "Teacher yo'q"} / {levelName}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/groups/${group.id}`}>Detail</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Student</p>
                    <p className="mt-1 text-xl font-black">
                      {groupMembers.filter((member) => member.role === "student").length}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Support</p>
                    <p className="mt-1 text-xl font-black">
                      {groupMembers.filter((member) => member.role === "support_teacher").length}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Status</p>
                    <p className="mt-1 text-xl font-black capitalize">{group.status}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {visibleGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Hali group yo&apos;q.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </AppShell>
    );
  }

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
