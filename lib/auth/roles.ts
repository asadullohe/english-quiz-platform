export type UserRole = "student" | "teacher" | "support_teacher" | "admin";

export const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  teacher: "/dashboard/teacher",
  support_teacher: "/dashboard/support",
  student: "/dashboard/student",
};

export function isDashboardRole(value: string | null | undefined): value is UserRole {
  return (
    value === "student" ||
    value === "teacher" ||
    value === "support_teacher" ||
    value === "admin"
  );
}
