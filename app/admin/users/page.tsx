import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      title="Users"
      description="Admin teacher/support teacher yaratadi, role va status boshqaradi."
      items={[
        "Create teacher/support teacher form",
        "Disable user action",
        "Role/status audit later",
      ]}
    />
  );
}
