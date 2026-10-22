import Link from "next/link";
import { requirePermission } from "@/lib/authorization/permissions";
import { getLearnerDashboard } from "@/lib/services/learning-service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { WelcomeCard } from "@/components/shadcn-space/card/card-04";

export default async function EnrollmentsPage() {
  const actor = await requirePermission("enrollments.apply");
  const enrollments = await getLearnerDashboard(actor.id);

  const totalCompleted = enrollments.reduce((sum, e) => sum + e.completedLessonCount, 0);
  const totalLessons = enrollments.reduce((sum, e) => sum + e.lessonCount, 0);

  return (
    <section className="space-y-6">
      <PageHeader
        title="My enrollments"
        description="Track your course applications, learning progress, cohorts, and attendance from one place."
      />

      {/* Personalized Learning Overview Banner */}
      <WelcomeCard
        name={actor.firstName}
        greeting="Welcome Back"
        metric1Label="Enrolled Courses"
        metric1Value={enrollments.length}
        metric1Suffix={enrollments.length === 1 ? " Course" : " Courses"}
        metric2Label="Completed Lessons"
        metric2Value={totalCompleted}
        metric2Suffix={totalLessons > 0 ? ` / ${totalLessons}` : " Lessons"}
      />

      {enrollments.length === 0 ? (
        <Card className="border-dashed p-6">
          <p className="text-sm text-slate-500">
            You have no enrollments yet. Open Courses to apply for a learning pathway.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((item) => {
            const progress = item.lessonCount
              ? Math.round((item.completedLessonCount / item.lessonCount) * 100)
              : 0;
            return (
              <Link key={item.id} href={`/dashboard/courses/${item.course.id}`}>
                <Card className="border-t-2 border-t-[#00a3e0] p-5 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-[#0a1f44]">{item.course.title}</h2>
                    <span className="rounded-full bg-[#e7f4fb] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0a1f44]">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7f4fb]">
                    <div
                      className="h-full rounded-full bg-[#00a3e0]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>
                      {item.completedLessonCount}/{item.lessonCount} lessons complete
                    </span>
                    <span>{progress}%</span>
                  </div>
                  {item.cohort ? (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Cohort: <span className="text-[#0a1f44]">{item.cohort.name}</span>
                    </p>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
