import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

type GroupDetail = {
  id: string;
  name: string;
  level_id: string | null;
  teacher_id: string;
  invite_code: string;
  invite_enabled: boolean;
  status: "active" | "archived";
  created_at: string;
};

type MemberDetail = {
  id: string;
  group_id: string;
  user_id: string;
  role: "student" | "teacher" | "support_teacher";
  joined_at: string;
  status: "active" | "removed";
};

type ProfileDetail = {
  id: string;
  full_name: string;
  role: UserRole;
};

type LevelDetail = {
  id: string;
  name: string;
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

function navForRole(role: UserRole) {
  if (role === "admin") {
    return adminNavItems;
  }

  if (role === "teacher") {
    return teacherNavItems;
  }

  if (role === "support_teacher") {
    return supportNavItems;
  }

  return studentNavItems;
}

function MemberList({
  members,
  profilesById,
  title,
}: {
  members: MemberDetail[];
  profilesById: Map<string, ProfileDetail>;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const profile = profilesById.get(member.user_id);

          return (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"
              key={member.id}
            >
              <div>
                <p className="font-bold">{profile?.full_name ?? "User topilmadi"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {new Date(member.joined_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {member.role}
              </span>
            </div>
          );
        })}

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali member yo&apos;q.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "active") {
    redirect("/auth/login");
  }

  const { id } = await params;
  const admin = createAdminClient();
  const [groupResult, membersResult, levelsResult] = await Promise.all([
    admin
      .from("groups")
      .select("id, name, level_id, teacher_id, invite_code, invite_enabled, status, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("group_members")
      .select("id, group_id, user_id, role, joined_at, status")
      .eq("group_id", id)
      .eq("status", "active"),
    admin.from("levels").select("id, name"),
  ]);

  const group = groupResult.data as GroupDetail | null;

  if (!group) {
    notFound();
  }

  const members = (membersResult.data ?? []) as MemberDetail[];
  const currentMembership = members.find((member) => member.user_id === profile.id);
  const canView =
    profile.role === "admin" || group.teacher_id === profile.id || Boolean(currentMembership);

  if (!canView) {
    redirect("/groups");
  }

  const profileIds = Array.from(new Set([group.teacher_id, ...members.map((member) => member.user_id)]));
  const profilesResult =
    profileIds.length > 0
      ? await admin.from("profiles").select("id, full_name, role").in("id", profileIds)
      : { data: [] };
  const profiles = (profilesResult.data ?? []) as ProfileDetail[];
  const profilesById = new Map(profiles.map((item) => [item.id, item]));
  const levels = (levelsResult.data ?? []) as LevelDetail[];
  const levelName = levels.find((level) => level.id === group.level_id)?.name ?? "Level yo'q";
  const teachers = members.filter((member) => member.role === "teacher");
  const supportTeachers = members.filter((member) => member.role === "support_teacher");
  const students = members.filter((member) => member.role === "student");
  const canManage = profile.role === "admin" || group.teacher_id === profile.id;

  return (
    <AppShell
      navItems={navForRole(profile.role)}
      title={group.name}
      subtitle={`${levelName} group detail, memberlar va classroom access.`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Students" value={String(students.length)} hint="Active student memberlar." />
        <StatCard
          label="Support"
          value={String(supportTeachers.length)}
          hint="Reviewga yordam beradiganlar."
        />
        <StatCard label="Teacher" value={String(teachers.length || 1)} hint="Group egasi." />
        <StatCard label="Status" value={group.status} hint="Group ochiq yoki archived." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground">Teacher</p>
            <p className="mt-1 font-bold">
              {profilesById.get(group.teacher_id)?.full_name ?? "Teacher yo'q"}
            </p>
          </div>
          {canManage ? (
            <div className="rounded-2xl border px-4 py-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Invite code</p>
              <p className="mt-1 text-lg font-black">
                {group.invite_code}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  {group.invite_enabled ? "open" : "off"}
                </span>
              </p>
            </div>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/groups">Grouplarga qaytish</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <MemberList members={teachers} profilesById={profilesById} title="Teacher" />
        <MemberList members={supportTeachers} profilesById={profilesById} title="Support teacher" />
        <MemberList members={students} profilesById={profilesById} title="Studentlar" />
      </div>
    </AppShell>
  );
}
