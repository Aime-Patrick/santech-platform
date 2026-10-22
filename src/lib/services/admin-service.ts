import { prisma } from "@/lib/db/prisma";

export function listAdminUsers() {
  return prisma.user.findMany({
    orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true }, orderBy: { permission: { key: "asc" } } },
            },
          },
        },
        orderBy: { role: { name: "asc" } },
      },
    },
  });
}

export function listAdminRoles() {
  return prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      permissions: { include: { permission: true }, orderBy: { permission: { group: "asc" } } },
      _count: { select: { users: true } },
    },
  });
}

export function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });
}

export function listAuditLogs() {
  return prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });
}
