import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const comments = await prisma.courseComment.findMany({ where: { courseId, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, learner: { select: { firstName: true, lastName: true } } } });
  return NextResponse.json({ data: comments });
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Sign in to comment on a course." }, { status: 401 });
  if (!hasPermission(actor, "enrollments.apply")) return NextResponse.json({ error: "Only learners can comment on courses." }, { status: 403 });
  const { courseId } = await params;
  const enrollment = await prisma.enrollment.findFirst({ where: { courseId, learnerId: actor.id, status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } }, select: { id: true } });
  if (!enrollment) return NextResponse.json({ error: "Complete an approved enrollment before commenting on this course." }, { status: 403 });
  const parsed = z.object({ body: z.string().trim().min(2).max(2000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a comment between 2 and 2000 characters." }, { status: 400 });
  const comment = await prisma.courseComment.create({ data: { courseId, learnerId: actor.id, body: parsed.data.body }, select: { id: true, body: true, status: true, createdAt: true } });
  return NextResponse.json({ data: comment, message: "Your comment was submitted for approval." }, { status: 201 });
}
