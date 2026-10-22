import { prisma } from "@/lib/db/prisma";
import { type PermissionKey, hasPermission } from "@/lib/authorization/permissions";

type DashboardUser = Parameters<typeof hasPermission>[0];

export type DashboardMetric = {
  key: string;
  label: string;
  value: number;
  detail: string;
  href: string;
  permission: string;
};

export type DashboardData = {
  roles: string[];
  permissions: string[];
  metrics: DashboardMetric[];
};

export async function getDashboardData(user: DashboardUser): Promise<DashboardData> {
  const permissions = [...new Set(user.roles.flatMap(({ role }) =>
    role.isActive ? role.permissions.map(({ permission }) => permission.key) : [],
  ))];
  const roles = user.roles.filter(({ role }) => role.isActive).map(({ role }) => role.key);
  const can = (permission: PermissionKey | string) => hasPermission(user, permission);
  const learnerOnly = roles.includes("learner") && !roles.some((role) => ["admin", "administrator", "staff"].includes(role));
  const metrics: DashboardMetric[] = [];

  if (can("users.view")) {
    const value = await prisma.user.count({ where: { status: "ACTIVE" } });
    metrics.push({ key: "users", label: "Active users", value, detail: "Platform members", href: "/dashboard/users", permission: "users.view" });
  }

  if (can("courses.view")) {
    const value = await prisma.catalogItem.count({ where: { status: "PUBLISHED" } });
    metrics.push({ key: "catalog", label: "Published catalog", value, detail: "Public items available", href: "/dashboard/catalog", permission: "courses.view" });
  }

  if (can("notifications.manage")) {
    const value = await prisma.cmsEntry.count({ where: { status: "PUBLISHED" } });
    metrics.push({ key: "website-content", label: "Published content", value, detail: "Website entries managed here", href: "/dashboard/catalog", permission: "notifications.manage" });
  }

  if (can("applications.review")) {
    const value = await prisma.application.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } });
    metrics.push({ key: "applications", label: "Applications to review", value, detail: "Awaiting a decision", href: "/dashboard/applications", permission: "applications.review" });
  }

  if (learnerOnly && can("enrollments.apply")) {
    const [enrollments, completedLessons] = await Promise.all([
      prisma.enrollment.count({ where: { learnerId: user.id, status: { in: ["PENDING", "APPROVED", "ACTIVE", "COMPLETED"] } } }),
      prisma.lessonProgress.count({ where: { learnerId: user.id, completedAt: { not: null } } }),
    ]);
    metrics.push({ key: "enrollments", label: "My enrollments", value: enrollments, detail: "Courses in your learning path", href: "/dashboard/enrollments", permission: "enrollments.apply" });
    metrics.push({ key: "progress", label: "Lessons completed", value: completedLessons, detail: "Keep your momentum going", href: "/dashboard/courses", permission: "enrollments.apply" });
  }

  if (can("certificates.view")) {
    const value = await prisma.certificate.count({ where: learnerOnly ? { learnerId: user.id, status: "ISSUED" } : { status: "ISSUED" } });
    metrics.push({ key: "certificates", label: learnerOnly ? "My certificates" : "Issued certificates", value, detail: learnerOnly ? "Achievements earned" : "Currently valid", href: "/dashboard/certificates", permission: "certificates.view" });
  }

  return { roles, permissions, metrics };
}

