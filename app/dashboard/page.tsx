import { redirectToRoleDashboard } from "@/lib/auth/session";

export default async function DashboardPage() {
  await redirectToRoleDashboard();
}
