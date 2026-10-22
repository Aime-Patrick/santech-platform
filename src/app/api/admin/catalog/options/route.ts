import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [categories, skills, tools] = await Promise.all([
    prisma.courseCategory.findMany({ where: { status: { not: "ARCHIVED" }, isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
    prisma.courseSkill.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
    prisma.courseTool.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
  ]);
  return NextResponse.json({ categories, skills, tools });
}
