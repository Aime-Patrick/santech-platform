import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function recordAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      metadata,
    },
  });
}
