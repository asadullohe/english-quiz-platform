import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

const navItems = [
  { href: "/review/questions", label: "Savollar review" },
  { href: "/review/reports", label: "Reportlar" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/groups", label: "Assigned groups" },
];

export default function SupportDashboardPage() {
  return (
    <AppShell
      navItems={navItems}
      title="Support teacher dashboard"
      subtitle="Assigned grouplar ichidagi student savollari va reportlarni tekshirish."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned groups" value="0" hint="Teacher biriktirgan guruhlar." />
        <StatCard label="Pending questions" value="0" hint="Approve yoki needs changes." />
        <StatCard label="Open reports" value="0" hint="Student report qilgan savollar." />
      </div>
    </AppShell>
  );
}
