import { BarChart3, BookOpen, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CourseAssessmentTable } from "@/components/reports/course-analytics-tables";
import { requirePermission } from "@/lib/authorization/permissions";
import { getCourseAssessmentReport } from "@/lib/services/course-analytics-service";

export const metadata = {
  title: "Assessment scores | SAN TECH",
  description: "Review lesson assessment scores across courses.",
};

export default async function AssessmentScoresPage() {
  const actor = await requirePermission("grades.view");
  const report = await getCourseAssessmentReport(actor);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Assessment scores"
        description="Average lesson scores based on grades recorded in the platform."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric icon={BarChart3} label="Average score" value={report.stats.averageScore === null ? "—" : `${report.stats.averageScore}%`} />
        <SummaryMetric icon={BookOpen} label="Courses with scores" value={report.stats.courses.toLocaleString()} />
        <SummaryMetric icon={GraduationCap} label="Scores recorded" value={report.stats.gradedAssessments.toLocaleString()} />
      </div>
      <section aria-label="Assessment scores by course" className="space-y-3">
        <div>
          <h2 className="font-semibold text-slate-900">Scores by course</h2>
          <p className="mt-1 text-sm text-slate-500">Each course average is weighted by the number of grades recorded.</p>
        </div>
        <CourseAssessmentTable rows={report.rows} />
      </section>
    </section>
  );
}

function SummaryMetric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
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
