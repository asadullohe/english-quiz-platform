import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const navItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/sessions", label: "Live quizlar" },
  { href: "/self-practice", label: "Self practice" },
];

export default function StudentDashboardPage() {
  return (
    <AppShell
      navItems={navItems}
      title="Student dashboard"
      subtitle="Savol yaratish, live quiz ishlash va self practice qilish uchun."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assignments" value="0" hint="Teacher bergan mavzular." />
        <StatCard label="Approved questions" value="0" hint="Siz yaratgan tasdiqlangan savollar." />
        <StatCard label="Self accuracy" value="--" hint="Practice natijalari keyin chiqadi." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student flow</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p>Invite code bilan groupga qo&apos;shiling.</p>
            <p>Assignment bo&apos;yicha savol kiriting.</p>
            <p>Reviewdan o&apos;tgan savollar keyingi darsdagi quizga tushadi.</p>
          </div>
          <Button asChild>
            <Link href="/groups/join">Groupga qo&apos;shilish</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
