import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { sendEnrollmentConfirmationEmail } from "@/lib/email/learner-email";

export async function POST(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sign in to continue with enrollment." }, { status: 401 });
  if (!hasPermission(actor, "enrollments.apply")) return NextResponse.json({ code: "FORBIDDEN", message: "Your account cannot request enrollment." }, { status: 403 });
  const { courseId } = await params;
  const course = await prisma.course.findFirst({ where: { id: courseId, status: "PUBLISHED", catalogItem: { category: "Courses" } }, select: { id: true, title: true, slug: true } });
  if (!course) return NextResponse.json({ code: "COURSE_UNAVAILABLE", message: "This course is not currently open for enrollment." }, { status: 404 });
  const existing = await prisma.enrollment.findFirst({ where: { courseId, learnerId: actor.id, status: { notIn: ["REJECTED", "WITHDRAWN"] } }, select: { id: true, status: true } });
  const loginUrl = `${process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3002"}/login`;
  if (existing) return NextResponse.json({ code: "ALREADY_ENROLLED", message: `You already have an enrollment for ${course.title}. Open your learner account to continue.`, enrollment: existing, loginUrl }, { status: 409 });
  const enrollment = await prisma.enrollment.create({ data: { courseId, learnerId: actor.id, status: "PENDING" }, select: { id: true, status: true, appliedAt: true } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "enrollment.applied", entityType: "Enrollment", entityId: enrollment.id, metadata: { courseId } } });
  await sendEnrollmentConfirmationEmail({ to: actor.email, firstName: actor.firstName, courseTitle: course.title, enrollmentStatus: enrollment.status });
  return NextResponse.json({ message: `Your enrollment request for ${course.title} has been received.`, enrollment, loginUrl }, { status: 201 });
}


