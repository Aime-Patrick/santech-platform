"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { issueCertificateForEnrollment } from "@/lib/services/certificate-service";
import { slugify } from "@/lib/slugify";
import { sendEnrollmentConfirmationEmail } from "@/lib/email/learner-email";

const optionalWeeks = z.preprocess((value) => value === "" || value === null ? undefined : Number(value), z.number().int().positive().max(104).optional());
const courseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(240).optional(),
  description: z.string().trim().max(3000).optional(),
  level: z.string().trim().max(40).optional(),
  durationWeeks: optionalWeeks,
});

const lessonSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().max(10000).optional(),
});

const cohortSchema = z.object({
  name: z.string().trim().min(2).max(100),
  startsAt: z.preprocess((value) => value ? new Date(String(value)) : undefined, z.date().optional()),
  endsAt: z.preprocess((value) => value ? new Date(String(value)) : undefined, z.date().optional()),
});

export async function createCourse(formData: FormData) {
  await requirePermission("courses.create");
  const title = String(formData.get("title") ?? "");
  const parsed = courseSchema.safeParse({
    title,
    summary: String(formData.get("summary") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    level: String(formData.get("level") ?? "").trim() || undefined,
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!parsed.success) throw new Error("Enter a valid course title and course details.");

  const course = await prisma.course.create({
    data: {
      ...parsed.data,
      slug: slugify(parsed.data.title),
    },
  });
  revalidatePath("/dashboard/courses");
  redirect(`/dashboard/courses/${course.id}`);
}

export async function updateCourseStatus(courseId: string, formData: FormData) {
  const actor = await requirePermission("courses.update");
  const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(formData.get("status"));
  const course = await prisma.course.update({ where: { id: courseId }, data: { status } });
  await prisma.auditLog.create({
    data: { actorId: actor.id, action: "course.status.updated", entityType: "Course", entityId: course.id, metadata: { status } },
  });
  revalidatePath("/dashboard/courses");
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function addLesson(courseId: string, formData: FormData) {
  const actor = await requirePermission("lessons.manage");
  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? "").trim() || undefined,
  });
  if (!parsed.success) throw new Error("Enter a valid lesson title.");

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, slug: true } });
  if (!course) throw new Error("Course not found");
  const lastLesson = await prisma.lesson.findFirst({ where: { courseId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const sortOrder = (lastLesson?.sortOrder ?? 0) + 1;
  const lesson = await prisma.lesson.create({
    data: { courseId, slug: `${slugify(parsed.data.title)}-${sortOrder}`, sortOrder, ...parsed.data },
  });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "lesson.created", entityType: "Lesson", entityId: lesson.id, metadata: { courseId } } });
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function createCohort(courseId: string, formData: FormData) {
  const actor = await requirePermission("cohorts.manage");
  const parsed = cohortSchema.safeParse({ name: formData.get("name"), startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt") });
  if (!parsed.success) throw new Error("Enter a valid cohort name and schedule.");
  const cohort = await prisma.cohort.create({ data: { courseId, ...parsed.data } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "cohort.created", entityType: "Cohort", entityId: cohort.id, metadata: { courseId } } });
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function assignLearnerToCohort(cohortId: string, formData: FormData) {
  const actor = await requirePermission("cohorts.manage");
  const learnerId = z.string().min(1).parse(formData.get("learnerId"));
  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId }, select: { id: true, courseId: true } });
  if (!cohort) throw new Error("Cohort not found");
  const enrollment = await prisma.enrollment.findFirst({ where: { learnerId, courseId: cohort.courseId, status: { notIn: ["REJECTED", "WITHDRAWN"] } }, select: { id: true } });
  if (!enrollment) throw new Error("The learner must have an active course application first.");

  await prisma.$transaction([
    prisma.cohortMember.upsert({ where: { cohortId_learnerId: { cohortId, learnerId } }, update: {}, create: { cohortId, learnerId } }),
    prisma.enrollment.update({ where: { id: enrollment.id }, data: { cohortId } }),
    prisma.auditLog.create({ data: { actorId: actor.id, action: "cohort.member.assigned", entityType: "Cohort", entityId: cohortId, metadata: { learnerId, enrollmentId: enrollment.id } } }),
  ]);
  revalidatePath(`/dashboard/courses/${cohort.courseId}`);
}

export async function assignInstructorToCourse(courseId: string, formData: FormData) {
  const actor = await requirePermission("courses.update");
  const instructorId = z.string().min(1).parse(formData.get("instructorId"));
  const instructor = await prisma.user.findFirst({ where: { id: instructorId, status: "ACTIVE", roles: { some: { role: { key: "instructor", isActive: true } } } }, select: { id: true } });
  if (!instructor) throw new Error("Select an active instructor account.");
  await prisma.courseInstructor.upsert({ where: { courseId_instructorId: { courseId, instructorId } }, update: {}, create: { courseId, instructorId } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "course.instructor.assigned", entityType: "Course", entityId: courseId, metadata: { instructorId } } });
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/cohorts");
}

export async function applyForEnrollment(courseId: string) {
  const actor = await requirePermission("enrollments.apply");
  const course = await prisma.course.findFirst({ where: { id: courseId, status: "PUBLISHED", catalogItem: { category: "Courses" } }, select: { id: true, title: true } });
  if (!course) throw new Error("This course is not open for enrollment.");
  const existing = await prisma.enrollment.findFirst({ where: { courseId, learnerId: actor.id, status: { notIn: ["REJECTED", "WITHDRAWN"] } } });
  if (existing) throw new Error("You already have an enrollment for this course. Open your learner account to continue.");

  const enrollment = await prisma.enrollment.create({ data: { courseId, learnerId: actor.id, status: "PENDING" } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "enrollment.applied", entityType: "Enrollment", entityId: enrollment.id, metadata: { courseId } } });
  await sendEnrollmentConfirmationEmail({ to: actor.email, firstName: actor.firstName, courseTitle: course.title, enrollmentStatus: enrollment.status });
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/enrollments");
}

export async function markLessonComplete(lessonId: string) {
  const actor = await requirePermission("enrollments.apply");
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true } });
  if (!lesson) throw new Error("Lesson not found");
  const enrollment = await prisma.enrollment.findFirst({ where: { learnerId: actor.id, courseId: lesson.courseId, status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } }, select: { id: true } });
  if (!enrollment) throw new Error("Your enrollment must be approved before completing lessons.");

  await prisma.lessonProgress.upsert({ where: { learnerId_lessonId: { learnerId: actor.id, lessonId } }, update: { completedAt: new Date() }, create: { learnerId: actor.id, lessonId, completedAt: new Date() } });
  const [lessonCount, completedLessonCount] = await Promise.all([
    prisma.lesson.count({ where: { courseId: lesson.courseId, status: "PUBLISHED" } }),
    prisma.lessonProgress.count({ where: { learnerId: actor.id, completedAt: { not: null }, lesson: { courseId: lesson.courseId, status: "PUBLISHED" } } }),
  ]);
  if (lessonCount > 0 && completedLessonCount >= lessonCount) {
    const completedEnrollment = await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: "COMPLETED", completedAt: new Date() }, select: { id: true } });
    await issueCertificateForEnrollment(completedEnrollment.id);
    revalidatePath("/dashboard/certificates");
  }
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "lesson.completed", entityType: "Lesson", entityId: lessonId, metadata: { courseId: lesson.courseId } } });
  revalidatePath(`/dashboard/courses/${lesson.courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/enrollments");
}



