import { BookOpen, GraduationCap, Percent } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CourseCompletionTable } from "@/components/reports/course-analytics-tables";
import { requirePermission } from "@/lib/authorization/permissions";
import { getCourseCompletionReport } from "@/lib/services/course-analytics-service";

export const metadata = {
  title: "Completion rates | SAN TECH",
  description: "Track lesson completion across active course enrollments.",
};

export default async function CompletionRatesPage() {
  const actor = await requirePermission("enrollments.review");
  const report = await getCourseCompletionReport(actor);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Completion rates"
        description="Published-lesson progress across approved and active course enrollments."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric icon={Percent} label="Overall completion" value={report.stats.completionRate === null ? "—" : `${report.stats.completionRate}%`} />
        <SummaryMetric icon={BookOpen} label="Courses with learners" value={report.stats.courses.toLocaleString()} />
        <SummaryMetric icon={GraduationCap} label="Active learners" value={report.stats.learners.toLocaleString()} />
      </div>
      <section aria-label="Course completion rates" className="space-y-3">
        <div>
          <h2 className="font-semibold text-slate-900">Course progress</h2>
          <p className="mt-1 text-sm text-slate-500">Completion is calculated from completed published lessons.</p>
        </div>
        <CourseCompletionTable rows={report.rows} />
      </section>
    </section>
  );
}

function SummaryMetric({ icon: Icon, label, value }: { icon: typeof Percent; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon className="size-4 text-indigo-600" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}
