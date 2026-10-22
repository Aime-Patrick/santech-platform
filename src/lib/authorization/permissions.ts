import { getCurrentUser } from "@/lib/auth/session";

export const PERMISSIONS = {
  dashboardView: "dashboard.view",
  usersView: "users.view",
  usersManage: "users.manage",
  rolesView: "roles.view",
  rolesManage: "roles.manage",
  coursesView: "courses.view",
  coursesCreate: "courses.create",
  coursesUpdate: "courses.update",
  coursesDelete: "courses.delete",
  lessonsManage: "lessons.manage",
  cohortsManage: "cohorts.manage",
  enrollmentsApply: "enrollments.apply",
  enrollmentsReview: "enrollments.review",
  attendanceView: "attendance.view",
  attendanceMark: "attendance.mark",
  gradesView: "grades.view",
  gradesManage: "grades.manage",
  applicationsCreate: "applications.create",
  applicationsReview: "applications.review",
  filesUpload: "files.upload",
  certificatesView: "certificates.view",
  certificatesIssue: "certificates.issue",
  certificatesRevoke: "certificates.revoke",
  notificationsManage: "notifications.manage",
  auditLogsView: "audit_logs.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type UserWithAccess = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function hasPermission(user: UserWithAccess, permission: PermissionKey | string) {
  return user.roles.some((userRole) =>
    userRole.role.isActive &&
    userRole.role.permissions.some(({ permission: assignedPermission }) => assignedPermission.key === permission),
  );
}

export function getPermissionKeys(user: UserWithAccess) {
  return [...new Set(user.roles.flatMap(({ role }) =>
    role.isActive ? role.permissions.map(({ permission }) => permission.key) : [],
  ))];
}

export function hasAnyPermission(user: UserWithAccess, permissions: string[]) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export async function requirePermission(permission: PermissionKey | string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!hasPermission(user, permission)) throw new Error("FORBIDDEN");
  return user;
}
