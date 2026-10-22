import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { catalogUpdateSchema } from "@/lib/content/catalog-admin-schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const parsed = catalogUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalog item", issues: parsed.error.flatten() }, { status: 400 });
  const { skillIds, toolIds, ...input } = parsed.data;
  delete input.sortOrder;
  try {
    const item = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.catalogItem.update({
        where: { id },
        data: {
          ...input,
          ...(input.rating === undefined ? {} : { rating: input.rating == null ? null : new Prisma.Decimal(input.rating) }),
          ...(skillIds ? { skills: { deleteMany: {}, create: skillIds.map((skillId, index) => ({ skillId, sortOrder: index })) } } : {}),
          ...(toolIds ? { tools: { deleteMany: {}, create: toolIds.map((toolId, index) => ({ toolId, sortOrder: index })) } } : {}),
        },
      });
      return updated;
    });
    await recordAuditLog({ actorId: actor.id, action: "catalog_item.updated", entityType: "CatalogItem", entityId: item.id, metadata: { slug: item.slug, status: item.status } });
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  try {
    const item = await prisma.catalogItem.update({ where: { id }, data: { status: "ARCHIVED" }, select: { id: true, slug: true } });
    await recordAuditLog({ actorId: actor.id, action: "catalog_item.archived", entityType: "CatalogItem", entityId: item.id, metadata: { slug: item.slug } });
    return NextResponse.json({ ok: true, archived: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    throw error;
  }
}
