import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { catalogWriteSchema } from "@/lib/content/catalog-admin-schemas";

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.catalogItem.findMany({
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: {
      courseCategory: { select: { id: true, name: true, slug: true } },
      imageAsset: { select: { id: true, publicId: true, url: true, alternativeText: true } },
      course: { select: { id: true, slug: true, title: true } },
      skills: { include: { skill: { select: { id: true, name: true, slug: true } } } },
      tools: { include: { tool: { select: { id: true, name: true, slug: true } } } },
    },
  });
  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = catalogWriteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalog item", issues: parsed.error.flatten() }, { status: 400 });
  const { skillIds, toolIds, ...input } = parsed.data;
  const lastItem = await prisma.catalogItem.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const item = await prisma.catalogItem.create({
    data: {
      ...input,
      skills: skillIds ? { create: skillIds.map((skillId, index) => ({ skillId, sortOrder: index })) } : undefined,
      tools: toolIds ? { create: toolIds.map((toolId, index) => ({ toolId, sortOrder: index })) } : undefined,
      sortOrder: (lastItem?.sortOrder ?? 0) + 1,
      rating: input.rating == null ? null : new Prisma.Decimal(input.rating),
    },
  });
  await recordAuditLog({ actorId: actor.id, action: "catalog_item.created", entityType: "CatalogItem", entityId: item.id, metadata: { slug: item.slug, status: item.status } });
  return NextResponse.json({ data: item }, { status: 201 });
}
