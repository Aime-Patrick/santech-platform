import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { getLearnerDashboard } from "@/lib/services/learning-service";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/shared/page-header";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function statusTone(status: string) {
  if (status === "APPROVED" || status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default async function EnrollmentsPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect("/login");

  const activeRoleKeys = actor.roles.filter(({ role }) => role.isActive).map(({ role }) => role.key);
  const isLearner = activeRoleKeys.includes("learner");
  if (!isLearner || !hasPermission(actor, "enrollments.apply")) {
    return (
      <section className="mx-auto max-w-3xl">
        <EmptyState
          icon={GraduationCap}
          eyebrow="Learner workspace"
          title="Enrollments are available to learners"
          description="Sign in with a learner account to view your courses, progress, cohorts, and attendance."
        />
      </section>
    );
  }

  const enrollments = await getLearnerDashboard(actor.id);
  const totalCompleted = enrollments.reduce((sum, item) => sum + item.completedLessonCount, 0);
  const totalLessons = enrollments.reduce((sum, item) => sum + item.lessonCount, 0);
  const activeCount = enrollments.filter((item) => item.status === "APPROVED" || item.status === "ACTIVE").length;
  const completedCount = enrollments.filter((item) => item.lessonCount > 0 && item.completedLessonCount >= item.lessonCount).length;
  const attendance = enrollments.reduce((sum, item) => sum + item.attendanceCount, 0);
  const attendancePresent = enrollments.reduce((sum, item) => sum + item.presentAttendanceCount, 0);
  const stats = [
    { label: "Enrolled courses", value: enrollments.length, icon: BookOpen, tone: "bg-indigo-50 text-indigo-600" },
    { label: "In progress", value: activeCount, icon: Clock3, tone: "bg-sky-50 text-sky-600" },
    { label: "Completed", value: completedCount, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Attendance", value: attendance ? `${attendancePresent}/${attendance}` : "—", icon: Users, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="My enrollments" description="Your learning journey, course progress, and cohort activity in one place." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-xl ${tone}`}><Icon className="size-4" /></span>
              <span className="text-xl font-semibold tracking-tight text-slate-950">{value}</span>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      {enrollments.length === 0 ? (
        <EmptyState icon={BookOpen} eyebrow="Start learning" title="No enrollments yet" description="Explore the course catalog and apply for a learning pathway to see it here." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Your courses</h2>
              <p className="mt-1 text-sm text-slate-500">{totalLessons ? `${totalCompleted} of ${totalLessons} lessons completed` : "Progress will appear as lessons become available."}</p>
            </div>
            <Link href="/dashboard/courses" className="hidden items-center gap-1 text-sm font-medium text-[#123568] hover:underline sm:inline-flex">Browse catalog <ArrowRight className="size-4" /></Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {enrollments.map((item) => {
              const progress = item.lessonCount ? Math.min(100, Math.round((item.completedLessonCount / item.lessonCount) * 100)) : 0;
              const startDate = formatDate(item.cohort?.startsAt ?? null);
              const endDate = formatDate(item.cohort?.endsAt ?? null);
              return (
                <Card key={item.id} className="border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500"><GraduationCap className="size-4 text-[#123568]" />Learning pathway</p>
                      <h3 className="truncate text-lg font-semibold text-slate-950">{item.course.title}</h3>
                    </div>
                    <Badge className={`border-0 ${statusTone(item.status)}`}>{item.status}</Badge>
                  </div>
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-600">Course progress</span><span className="font-semibold text-slate-950">{progress}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#123568] transition-all" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-2 text-xs text-slate-500">{item.completedLessonCount} of {item.lessonCount} lessons complete</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    {item.cohort ? <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{item.cohort.name}</span> : null}
                    {startDate ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{startDate}{endDate ? ` – ${endDate}` : ""}</span> : null}
                    {item.attendanceCount ? <span>{item.presentAttendanceCount}/{item.attendanceCount} attendance</span> : null}
                  </div>
                  <Link href={`/dashboard/courses/${item.course.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#123568] hover:underline">Open course <ArrowRight className="size-4" /></Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
