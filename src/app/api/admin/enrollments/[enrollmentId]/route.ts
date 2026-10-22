import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { sendEnrollmentConfirmationEmail } from "@/lib/email/learner-email";

const statusSchema = z.enum(["PENDING", "APPROVED", "ACTIVE", "REJECTED", "WITHDRAWN", "COMPLETED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ enrollmentId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "enrollments.review")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { enrollmentId } = await params;
  const parsed = z.object({ status: statusSchema }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid enrollment status is required." }, { status: 400 });
  const existing = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { learner: { select: { email: true, firstName: true } }, course: { select: { title: true } } } });
  if (!existing) return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  const enrollment = await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: parsed.data.status, ...(parsed.data.status === "COMPLETED" ? { completedAt: new Date() } : {}) }, select: { id: true, status: true, completedAt: true } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "enrollment.status.updated", entityType: "Enrollment", entityId: enrollment.id, metadata: { from: existing.status, to: enrollment.status } } });
  const emailSent = await sendEnrollmentConfirmationEmail({ to: existing.learner.email, firstName: existing.learner.firstName, courseTitle: existing.course.title, enrollmentStatus: enrollment.status });
  return NextResponse.json({ enrollment, emailSent });
}
