"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

const roleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  key: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{1,47}$/),
  description: z.string().trim().max(240).optional(),
});

function permissionIdsFrom(formData: FormData) {
  return formData.getAll("permissionIds").filter((value): value is string => typeof value === "string");
}

export async function createRole(formData: FormData) {
  const actor = await requirePermission("roles.manage");
  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    key: formData.get("key"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) throw new Error("Enter a valid role name and key.");

  const role = await prisma.role.create({
    data: {
      ...parsed.data,
      permissions: { create: permissionIdsFrom(formData).map((permissionId) => ({ permissionId })) },
    },
  });
  await prisma.auditLog.create({
    data: { actorId: actor.id, action: "role.created", entityType: "Role", entityId: role.id, metadata: { key: role.key } },
  });
  revalidatePath("/dashboard/roles");
}

export async function updateRole(roleId: string, formData: FormData) {
  const actor = await requirePermission("roles.manage");
  const parsed = roleSchema.pick({ name: true, description: true }).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) throw new Error("Enter a valid role name.");

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");
  const isActive = formData.get("isActive") === "on";
  if (role.key === "administrator" && !isActive) {
    const activeAdministrators = await prisma.user.count({
      where: { status: "ACTIVE", roles: { some: { role: { key: "administrator" } } } },
    });
    if (activeAdministrators > 0) throw new Error("The system administrator role cannot be deactivated while assigned.");
  }

  const permissionIds = permissionIdsFrom(formData);
  await prisma.$transaction(async (transaction) => {
    await transaction.role.update({ where: { id: roleId }, data: { ...parsed.data, isActive } });
    await transaction.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await transaction.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) });
    }
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "role.updated",
        entityType: "Role",
        entityId: roleId,
        metadata: { isActive, permissionIds },
      },
    });
  });
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/users");
}

