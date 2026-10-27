"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasPermission, requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { getInstructorCohort } from "@/lib/services/instructor-service";

const attendanceStatus = z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]);
const scoreSchema = z.coerce.number().int().min(0).max(100);

async function requireCohortAccess(cohortId: string) {
  const actor = await requirePermission("attendance.mark");
  const includeAll = actor.roles.some((userRole: { role: { key: string } }) => userRole.role.key === "administrator");
  const cohort = await getInstructorCohort(cohortId, actor.id, includeAll);
  if (!cohort) throw new Error("You are not assigned to this cohort.");
  return { actor, cohort };
}

export async function markAttendance(cohortId: string, learnerId: string, formData: FormData) {
  const { actor, cohort } = await requireCohortAccess(cohortId);
  const status = attendanceStatus.parse(formData.get("status"));
  const sessionDate = z.coerce.date().parse(formData.get("sessionDate"));
  const lessonId = String(formData.get("lessonId") ?? "").trim() || null;
  if (!cohort.members.some((member: { learner: { id: string } }) => member.learner.id === learnerId)) throw new Error("Learner is not a member of this cohort.");
  if (lessonId && !cohort.course.lessons.some((lesson: { id: string }) => lesson.id === lessonId)) throw new Error("Lesson does not belong to this course.");

  const record = await prisma.attendance.upsert({
    where: { cohortId_learnerId_sessionDate: { cohortId, learnerId, sessionDate } },
    update: { status, lessonId, markedById: actor.id },
    create: { cohortId, learnerId, sessionDate, status, lessonId, markedById: actor.id },
  });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "attendance.marked", entityType: "Attendance", entityId: record.id, metadata: { cohortId, learnerId, status, sessionDate: sessionDate.toISOString() } } });
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
  revalidatePath("/dashboard/attendance");
}

export async function saveGrade(cohortId: string, learnerId: string, formData: FormData) {
  const { actor, cohort } = await requireCohortAccess(cohortId);
  if (!hasPermission(actor, "grades.manage")) throw new Error("You do not have permission to manage grades.");
  const lessonId = z.string().min(1).parse(formData.get("lessonId"));
  const score = scoreSchema.parse(formData.get("score"));
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  if (!cohort.members.some((member: { learner: { id: string } }) => member.learner.id === learnerId)) throw new Error("Learner is not a member of this cohort.");
  if (!cohort.course.lessons.some((lesson: { id: string }) => lesson.id === lessonId)) throw new Error("Lesson does not belong to this course.");

  const grade = await prisma.grade.upsert({ where: { learnerId_lessonId: { learnerId, lessonId } }, update: { score, feedback, gradedById: actor.id }, create: { learnerId, lessonId, score, feedback, gradedById: actor.id } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "grade.saved", entityType: "Grade", entityId: grade.id, metadata: { cohortId, learnerId, lessonId, score } } });
  revalidatePath(`/dashboard/cohorts/${cohortId}`);
}
