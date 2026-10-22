"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authorization/permissions";
import { sendEnrollmentConfirmationEmail } from "@/lib/email/learner-email";

const statusSchema = z.enum(["PENDING", "APPROVED", "ACTIVE", "REJECTED", "WITHDRAWN"]);

export async function updateEnrollmentStatus(enrollmentId: string, formData: FormData) {
  const actor = await requirePermission("enrollments.review");
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) throw new Error("Choose a valid enrollment status.");
  const existing = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { learner: true, course: { select: { title: true } } } });
  if (!existing) throw new Error("Enrollment not found.");
  const enrollment = await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: parsed.data }, select: { id: true, status: true } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "enrollment.status.updated", entityType: "Enrollment", entityId: enrollment.id, metadata: { from: existing.status, to: enrollment.status } } });
  await sendEnrollmentConfirmationEmail({ to: existing.learner.email, firstName: existing.learner.firstName, courseTitle: existing.course.title, enrollmentStatus: enrollment.status });
  revalidatePath("/dashboard/enrollment-review");
  revalidatePath("/dashboard/enrollments");
}