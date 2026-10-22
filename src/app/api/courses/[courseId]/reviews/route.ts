import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), title: z.string().trim().max(120).optional(), body: z.string().trim().min(10).max(2000) });

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const reviews = await prisma.courseReview.findMany({ where: { courseId, status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, select: { id: true, rating: true, title: true, body: true, createdAt: true, learner: { select: { firstName: true, lastName: true } } } });
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return NextResponse.json({ data: reviews, summary: { count: reviews.length, average: Number(average.toFixed(1)) } });
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  if (!hasPermission(actor, "enrollments.apply")) return NextResponse.json({ error: "Only learners can review courses." }, { status: 403 });
  const { courseId } = await params;
  const enrollment = await prisma.enrollment.findFirst({ where: { courseId, learnerId: actor.id, status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } }, select: { id: true } });
  if (!enrollment) return NextResponse.json({ error: "Complete an approved enrollment before reviewing this course." }, { status: 403 });
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a rating and a review of at least 10 characters." }, { status: 400 });
  const review = await prisma.courseReview.upsert({ where: { courseId_learnerId: { courseId, learnerId: actor.id } }, update: { ...parsed.data, status: "PENDING" }, create: { courseId, learnerId: actor.id, ...parsed.data }, select: { id: true, rating: true, title: true, body: true, status: true } });
  return NextResponse.json({ data: review, message: "Your review was submitted for approval." }, { status: 201 });
}
