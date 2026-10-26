import { requirePermission, hasPermission } from "@/lib/authorization/permissions";
import { listCourses } from "@/lib/services/course-service";

import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsCard } from "@/components/shadcn-space/card/card-05";
import { CourseCreateDrawer } from "@/components/courses/course-create-drawer";
import { CourseListClient } from "@/components/courses/course-list-client";

export default async function CoursesPage() {
  const actor = await requirePermission("courses.view");
  const canManage = hasPermission(actor, "courses.create") || hasPermission(actor, "courses.update");
  const courses = await listCourses(canManage);
  const canCreate = hasPermission(actor, "courses.create");

  const published = courses.filter((c) => c.status === "PUBLISHED").length;
  const drafts = courses.filter((c) => c.status === "DRAFT").length;
  const totalEnrolled = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const publishedPercent = courses.length > 0 ? Math.round((published / courses.length) * 100) : 0;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage published courses, curriculum, and enrolled learners across cohorts."
        actions={canCreate ? <CourseCreateDrawer /> : null}
      />

      {/* Curriculum Analytics Summary */}
      <AnalyticsCard
        mainDashboard={{
          title: "Course activity & enrollment analytics",
          description: "Real-time activity across published courses and enrolled learners",
          metrics: [
            {
              label: "Published Courses",
              value: `${published} / ${courses.length}`,
              percentage: `${publishedPercent}% live`,
              isPositive: true,
            },
            {
              label: "Total Enrolled",
              value: `${totalEnrolled}`,
              percentage: "+18% this cycle",
              isPositive: true,
            },
            {
              label: "Drafts In Progress",
              value: `${drafts}`,
              percentage: drafts > 0 ? "Under review" : "All live",
              isPositive: drafts === 0,
            },
          ],
        }}
      />

      {/* Course List with Real-time Search and Status Filter Tabs */}
      <CourseListClient courses={courses} />
    </section>
  );
}
