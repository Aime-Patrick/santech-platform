import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";

const typeSchema = z.enum(["category", "skill", "tool"]);
const writeSchema = z.object({
  name: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(180),
  description: z.string().trim().max(400).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  iconName: z.string().trim().max(80).nullable().optional(),
});

type TaxonomyType = z.infer<typeof typeSchema>;

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const type = typeSchema.safeParse(new URL(request.url).searchParams.get("type"));
  if (!type.success) return NextResponse.json({ error: "Invalid taxonomy type" }, { status: 400 });
  return NextResponse.json({ data: await listTaxonomy(type.data) });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const type = typeSchema.safeParse(new URL(request.url).searchParams.get("type"));
  if (!type.success) return NextResponse.json({ error: "Invalid taxonomy type" }, { status: 400 });
  const parsed = writeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid taxonomy item", issues: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  try {
    const item = await createTaxonomy(type.data, data);
    await recordAuditLog({ actorId: actor.id, action: `taxonomy.${type.data}.created`, entityType: type.data, entityId: item.id, metadata: { slug: item.slug } });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "That slug already exists." }, { status: 409 });
    throw error;
  }
}

async function listTaxonomy(type: TaxonomyType) {
  if (type === "category") return prisma.courseCategory.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
  if (type === "skill") return prisma.courseSkill.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
  return prisma.courseTool.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
}

async function createTaxonomy(type: TaxonomyType, data: z.infer<typeof writeSchema>) {
  if (type === "category") {
    const last = await prisma.courseCategory.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    return prisma.courseCategory.create({ data: { name: data.name, slug: data.slug, description: data.description, sortOrder: (last?.sortOrder ?? 0) + 1 } });
  }
  if (type === "skill") {
    const last = await prisma.courseSkill.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    return prisma.courseSkill.create({ data: { name: data.name, slug: data.slug, description: data.description, category: data.category, sortOrder: (last?.sortOrder ?? 0) + 1 } });
  }
  const last = await prisma.courseTool.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  return prisma.courseTool.create({ data: { name: data.name, slug: data.slug, description: data.description, category: data.category, iconName: data.iconName, sortOrder: (last?.sortOrder ?? 0) + 1 } });
}
