import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

const navItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/groups", label: "All groups" },
  { href: "/review/reports", label: "Moderation" },
];

export default function AdminDashboardPage() {
  return (
    <AppShell
      navItems={navItems}
      title="Admin dashboard"
      subtitle="Teacher/support accountlar, user status va platform nazorati."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Teachers" value="0" hint="Admin panel orqali yaratiladi." />
        <StatCard label="Support teachers" value="0" hint="Teacher groupga biriktiradi." />
        <StatCard label="Disabled users" value="0" hint="RLS active statusni tekshiradi." />
      </div>
    </AppShell>
  );
}
