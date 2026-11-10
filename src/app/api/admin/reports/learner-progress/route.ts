import { NextResponse } from "next/server";
import { Prisma, type EnrollmentStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

const enrollmentStatuses = ["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "REJECTED", "WITHDRAWN"] as const;

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasAnyPermission(actor, ["enrollments.review"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const page = positiveInteger(params.get("page"), 1);
  const pageSize = Math.min(positiveInteger(params.get("pageSize"), 25), 100);
  const search = params.get("search")?.trim().slice(0, 160) ?? "";
  const statusParam = params.get("status");
  const status = enrollmentStatuses.find((candidate) => candidate === statusParam);

  const baseWhere: Prisma.EnrollmentWhereInput = search
    ? {
        OR: [
          { learner: { is: { firstName: { contains: search, mode: "insensitive" } } } },
          { learner: { is: { lastName: { contains: search, mode: "insensitive" } } } },
          { learner: { is: { email: { contains: search, mode: "insensitive" } } } },
          { course: { is: { title: { contains: search, mode: "insensitive" } } } },
          { cohort: { is: { name: { contains: search, mode: "insensitive" } } } },
        ],
      }
    : {};
  const where: Prisma.EnrollmentWhereInput = {
    ...baseWhere,
    ...(status ? { status: status as EnrollmentStatus } : {}),
  };

  const [total, statusCounts, enrollments] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.enrollment.findMany({
      where,
      orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        learner: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, _count: { select: { lessons: true } } } },
        cohort: { select: { name: true } },
      },
    }),
  ]);

  const learnerIds = [...new Set(enrollments.map((enrollment) => enrollment.learner.id))];
  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.course.id))];
  const [progress, grades] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { learnerId: { in: learnerIds }, lesson: { courseId: { in: courseIds } }, completedAt: { not: null } },
      select: { learnerId: true, lesson: { select: { courseId: true } } },
    }),
    prisma.grade.findMany({
      where: { learnerId: { in: learnerIds }, lesson: { courseId: { in: courseIds } } },
      select: { learnerId: true, score: true, lesson: { select: { courseId: true } } },
    }),
  ]);

  const keyFor = (learnerId: string, courseId: string) => `${learnerId}:${courseId}`;
  const completedByLearnerCourse = new Map<string, number>();
  for (const record of progress) {
    const key = keyFor(record.learnerId, record.lesson.courseId);
    completedByLearnerCourse.set(key, (completedByLearnerCourse.get(key) ?? 0) + 1);
  }
  const scoresByLearnerCourse = new Map<string, number[]>();
  for (const grade of grades) {
    const key = keyFor(grade.learnerId, grade.lesson.courseId);
    scoresByLearnerCourse.set(key, [...(scoresByLearnerCourse.get(key) ?? []), grade.score]);
  }

  const data = enrollments.map((enrollment) => {
    const key = keyFor(enrollment.learner.id, enrollment.course.id);
    const totalLessons = enrollment.course._count.lessons;
    const completedLessons = completedByLearnerCourse.get(key) ?? 0;
    const scores = scoresByLearnerCourse.get(key) ?? [];
    return {
      id: enrollment.id,
      learnerName: `${enrollment.learner.firstName} ${enrollment.learner.lastName}`.trim(),
      email: enrollment.learner.email,
      courseTitle: enrollment.course.title,
      cohortName: enrollment.cohort?.name ?? "No cohort assigned",
      status: enrollment.status,
      completedLessons,
      totalLessons,
      progress: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
      averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      appliedAt: enrollment.appliedAt.toISOString(),
    };
  });

  const counts = new Map(statusCounts.map((item) => [item.status, item._count._all]));
  const stats = {
    total: statusCounts.reduce((sum, item) => sum + item._count._all, 0),
    pending: counts.get("PENDING") ?? 0,
    active: (counts.get("APPROVED") ?? 0) + (counts.get("ACTIVE") ?? 0),
    completed: counts.get("COMPLETED") ?? 0,
  };

  return NextResponse.json({
    data,
    meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    stats,
  });
}
