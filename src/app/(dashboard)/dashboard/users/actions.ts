"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

const userStatusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED", "ARCHIVED"]);

export async function updateUserAccess(userId: string, formData: FormData) {
  const actor = await requirePermission("users.manage");
  const status = userStatusSchema.parse(formData.get("status"));
  const roleIds = formData.getAll("roleIds").filter((value): value is string => typeof value === "string");

  const [target, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } }),
    prisma.role.findMany({ where: { id: { in: roleIds }, isActive: true }, select: { id: true, key: true } }),
  ]);
  if (!target) throw new Error("User not found");

  const hadAdministratorRole = target.roles.some(({ role }) => role.key === "administrator");
  const keepsAdministratorRole = roles.some((role) => role.key === "administrator");
  if (hadAdministratorRole && (!keepsAdministratorRole || status !== "ACTIVE")) {
    const activeAdministrators = await prisma.user.count({
      where: {
        status: "ACTIVE",
        roles: { some: { role: { key: "administrator", isActive: true } } },
      },
    });
    if (activeAdministrators <= 1) {
      throw new Error("The last active administrator cannot be removed or deactivated.");
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({ where: { id: userId }, data: { status } });
    await transaction.userRole.deleteMany({ where: { userId } });
    if (roles.length > 0) {
      await transaction.userRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id, assignedBy: actor.id })),
      });
    }
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.access.updated",
        entityType: "User",
        entityId: userId,
        metadata: { status, roleIds },
      },
    });
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/roles");
}
