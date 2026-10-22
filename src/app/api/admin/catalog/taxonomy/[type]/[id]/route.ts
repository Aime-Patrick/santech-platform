import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";

const typeSchema = z.enum(["category", "skill", "tool"]);
const updateSchema = z.object({ name: z.string().trim().min(1).max(150).optional(), slug: z.string().trim().min(1).max(180).optional(), description: z.string().trim().max(400).nullable().optional(), category: z.string().trim().max(80).nullable().optional(), iconName: z.string().trim().max(80).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional() });
type RouteContext = { params: Promise<{ type: string; id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type: rawType, id } = await context.params;
  const type = typeSchema.safeParse(rawType);
  const parsed = updateSchema.safeParse(await request.json());
  if (!type.success || !parsed.success) return NextResponse.json({ error: "Invalid taxonomy update" }, { status: 400 });
  try {
    const item = type.data === "category" ? await prisma.courseCategory.update({ where: { id }, data: parsed.data }) : type.data === "skill" ? await prisma.courseSkill.update({ where: { id }, data: parsed.data }) : await prisma.courseTool.update({ where: { id }, data: parsed.data });
    await recordAuditLog({ actorId: actor.id, action: `taxonomy.${type.data}.updated`, entityType: type.data, entityId: item.id, metadata: { slug: item.slug, status: item.status } });
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Taxonomy item not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type: rawType, id } = await context.params;
  const type = typeSchema.safeParse(rawType);
  if (!type.success) return NextResponse.json({ error: "Invalid taxonomy type" }, { status: 400 });
  try {
    if (type.data === "category") {
      const used = await prisma.catalogItem.count({ where: { categoryId: id } });
      if (used) return NextResponse.json({ error: `This category is used by ${used} catalog item(s). Archive it instead.` }, { status: 409 });
      await prisma.courseCategory.delete({ where: { id } });
    } else if (type.data === "skill") {
      const used = await prisma.catalogItemSkill.count({ where: { skillId: id } });
      if (used) return NextResponse.json({ error: `This skill is used by ${used} catalog item(s). Archive it instead.` }, { status: 409 });
      await prisma.courseSkill.delete({ where: { id } });
    } else {
      const used = await prisma.catalogItemTool.count({ where: { toolId: id } });
      if (used) return NextResponse.json({ error: `This tool is used by ${used} catalog item(s). Archive it instead.` }, { status: 409 });
      await prisma.courseTool.delete({ where: { id } });
    }
    await recordAuditLog({ actorId: actor.id, action: `taxonomy.${type.data}.deleted`, entityType: type.data, entityId: id });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Taxonomy item not found" }, { status: 404 });
    throw error;
  }
}