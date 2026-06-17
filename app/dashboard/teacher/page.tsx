import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const navItems = [
  { href: "/groups", label: "Guruhlar" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/review/questions", label: "Review queue" },
  { href: "/quizzes", label: "Quiz builder" },
  { href: "/sessions", label: "Live sessions" },
];

export default function TeacherDashboardPage() {
  return (
    <AppShell
      navItems={navItems}
      title="Teacher dashboard"
      subtitle="Group, assignment, review, live quiz va reportlarni boshqarish joyi."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active groups" value="0" hint="Invite code bilan student qo'shiladi." />
        <StatCard label="Pending review" value="0" hint="Student savollari shu yerga tushadi." />
        <StatCard label="Live sessions" value="0" hint="Manual Start bilan boshlanadi." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keyingi build tasklar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p>1. Group create + invite code server action.</p>
          <p>2. Assignment create form va student submission flow.</p>
          <p>3. Review queue status actions.</p>
          <p>4. Quiz builder + live session snapshot.</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
