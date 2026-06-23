import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { JoinGroupForm } from "./join-client";

const studentNavItems = [
  { href: "/groups", label: "Mening guruhlarim" },
  { href: "/assignments", label: "Topshiriqlar" },
  { href: "/sessions", label: "Live quizlar" },
  { href: "/self-practice", label: "Self practice" },
];

export default async function JoinGroupPage() {
  const profile = await getCurrentProfile();

  return (
    <AppShell
      navItems={studentNavItems}
      title="Groupga qo'shilish"
      subtitle="Teacher bergan invite code orqali classroom groupga qo'shiling."
    >
      {profile?.status === "active" && profile.role === "student" ? (
        <JoinGroupForm />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Invite code bilan qo&apos;shilish uchun student account kerak.
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
