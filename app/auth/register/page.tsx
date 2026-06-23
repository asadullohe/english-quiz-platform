import { redirect } from "next/navigation";
import { RegisterForm } from "@/app/auth/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_BY_ROLE, isDashboardRole } from "@/lib/auth/roles";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function RegisterPage() {
  const profile = await getCurrentProfile();

  if (profile?.status === "active" && isDashboardRole(profile.role)) {
    redirect(DASHBOARD_BY_ROLE[profile.role]);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student account yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}
