import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({ kind: z.enum(["review", "comment"]), id: z.string().min(1), status: z.enum(["PENDING", "PUBLISHED", "REJECTED"]) });

export async function PATCH(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Feedback type, id, and status are required." }, { status: 400 });
  const { kind, id, status } = parsed.data;
  const feedback = kind === "review"
    ? await prisma.courseReview.update({ where: { id }, data: { status }, select: { id: true, status: true } })
    : await prisma.courseComment.update({ where: { id }, data: { status }, select: { id: true, status: true } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: `course.${kind}.status.updated`, entityType: kind === "review" ? "CourseReview" : "CourseComment", entityId: id, metadata: { status } } });
  return NextResponse.json({ data: feedback });
}
