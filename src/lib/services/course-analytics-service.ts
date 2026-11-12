import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/authorization/permissions";

type AnalyticsUser = Parameters<typeof hasPermission>[0];

export type CourseCompletionRow = {
  courseId: string;
  courseTitle: string;
  learnerCount: number;
  lessonCount: number;
  completionRate: number | null;
};

export type CourseAssessmentRow = {
  courseId: string;
  courseTitle: string;
  gradedAssessments: number;
  averageScore: number;
};

function isAdministrator(user: AnalyticsUser) {
  return user.roles.some(({ role }) => role.isActive && role.key === "administrator");
}

function isLearnerOnly(user: AnalyticsUser) {
  const activeRoles = user.roles
    .filter(({ role }) => role.isActive)
    .map(({ role }) => role.key);
  return activeRoles.includes("learner") && !activeRoles.some((key) =>
    ["administrator", "instructor"].includes(key),
  );
}

function assignedCourseScope(user: AnalyticsUser): Prisma.CourseWhereInput {
  return {
    OR: [
      { instructors: { some: { instructorId: user.id } } },
      { cohorts: { some: { instructors: { some: { instructorId: user.id } } } } },
    ],
  };
}

export async function getCourseCompletionReport(user: AnalyticsUser) {
  const enrollmentWhere: Prisma.EnrollmentWhereInput = {
    status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] },
    ...(isAdministrator(user) ? {} : { course: assignedCourseScope(user) }),
  };
  const enrollments = await prisma.enrollment.findMany({
    where: enrollmentWhere,
    select: {
      learnerId: true,
      courseId: true,
      course: {
        select: {
          title: true,
          _count: {
            select: { lessons: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });

  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
  const learnerIds = [...new Set(enrollments.map((enrollment) => enrollment.learnerId))];
  const progress = courseIds.length && learnerIds.length
    ? await prisma.lessonProgress.findMany({
        where: {
          learnerId: { in: learnerIds },
          completedAt: { not: null },
          lesson: { courseId: { in: courseIds }, status: "PUBLISHED" },
        },
        select: { learnerId: true, lesson: { select: { courseId: true } } },
      })
    : [];

  const courseStats = new Map<string, {
    courseTitle: string;
    lessonCount: number;
    learners: Set<string>;
  }>();
  for (const enrollment of enrollments) {
    const stat = courseStats.get(enrollment.courseId) ?? {
      courseTitle: enrollment.course.title,
      lessonCount: enrollment.course._count.lessons,
      learners: new Set<string>(),
    };
    stat.learners.add(enrollment.learnerId);
    courseStats.set(enrollment.courseId, stat);
  }

  const completedByLearnerCourse = new Map<string, number>();
  for (const record of progress) {
    const key = `${record.learnerId}:${record.lesson.courseId}`;
    completedByLearnerCourse.set(key, (completedByLearnerCourse.get(key) ?? 0) + 1);
  }

  const completionByCourse = [...courseStats.entries()]
    .map(([courseId, stat]) => {
      const possibleLessons = stat.learners.size * stat.lessonCount;
      const completedLessons = [...stat.learners].reduce(
        (total, learnerId) => total + Math.min(
          completedByLearnerCourse.get(`${learnerId}:${courseId}`) ?? 0,
          stat.lessonCount,
        ),
        0,
      );
      return {
        possibleLessons,
        completedLessons,
        row: {
          courseId,
          courseTitle: stat.courseTitle,
          learnerCount: stat.learners.size,
          lessonCount: stat.lessonCount,
          completionRate: possibleLessons
            ? Math.round((completedLessons / possibleLessons) * 100)
            : null,
        },
      };
    });
  const rows: CourseCompletionRow[] = completionByCourse
    .map(({ row }) => row)
    .sort((left, right) => left.courseTitle.localeCompare(right.courseTitle));

  const possibleLessons = completionByCourse.reduce(
    (total, item) => total + item.possibleLessons,
    0,
  );
  const completedLessons = completionByCourse.reduce(
    (total, item) => total + item.completedLessons,
    0,
  );

  return {
    rows,
    stats: {
      courses: rows.length,
      learners: new Set(enrollments.map((enrollment) => enrollment.learnerId)).size,
      completionRate: possibleLessons
        ? Math.round((completedLessons / possibleLessons) * 100)
        : null,
    },
  };
}

export async function getCourseAssessmentReport(user: AnalyticsUser) {
  const where: Prisma.GradeWhereInput = isAdministrator(user)
    ? {}
    : isLearnerOnly(user)
      ? { learnerId: user.id }
      : { lesson: { course: assignedCourseScope(user) } };
  const gradesByLesson = await prisma.grade.groupBy({
    by: ["lessonId"],
    where,
    _sum: { score: true },
    _count: { _all: true },
  });
  const lessonIds = gradesByLesson.map((grade) => grade.lessonId);
  const lessons = lessonIds.length
    ? await prisma.lesson.findMany({
        where: { id: { in: lessonIds } },
        select: { id: true, course: { select: { id: true, title: true } } },
      })
    : [];
  const courseByLesson = new Map(
    lessons.map((lesson) => [lesson.id, lesson.course]),
  );
  const stats = new Map<string, {
    courseTitle: string;
    gradedAssessments: number;
    weightedScore: number;
  }>();

  for (const grade of gradesByLesson) {
    const course = courseByLesson.get(grade.lessonId);
    if (!course) continue;
    const count = grade._count._all;
    const stat = stats.get(course.id) ?? {
      courseTitle: course.title,
      gradedAssessments: 0,
      weightedScore: 0,
    };
    stat.gradedAssessments += count;
    stat.weightedScore += grade._sum.score ?? 0;
    stats.set(course.id, stat);
  }

  const rows: CourseAssessmentRow[] = [...stats.entries()]
    .map(([courseId, stat]) => ({
      courseId,
      courseTitle: stat.courseTitle,
      gradedAssessments: stat.gradedAssessments,
      averageScore: Math.round(stat.weightedScore / stat.gradedAssessments),
    }))
    .sort((left, right) => left.courseTitle.localeCompare(right.courseTitle));

  const totalGrades = rows.reduce((total, row) => total + row.gradedAssessments, 0);
  const weightedScore = rows.reduce(
    (total, row) => total + row.averageScore * row.gradedAssessments,
    0,
  );

  return {
    rows,
    stats: {
      courses: rows.length,
      gradedAssessments: totalGrades,
      averageScore: totalGrades ? Math.round(weightedScore / totalGrades) : null,
    },
  };
}
