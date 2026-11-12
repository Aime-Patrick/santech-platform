import type {
  CourseAssessmentRow,
  CourseCompletionRow,
} from "@/lib/services/course-analytics-service";

export function CourseCompletionTable({ rows }: { rows: CourseCompletionRow[] }) {
  if (!rows.length) {
    return <ReportEmptyState message="No active course enrollments are available for this report yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Course</th>
            <th className="px-5 py-3 text-right">Learners</th>
            <th className="px-5 py-3">Published lessons</th>
            <th className="w-64 px-5 py-3">Completion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.courseId}>
              <td className="px-5 py-4 font-medium text-slate-900">{row.courseTitle}</td>
              <td className="px-5 py-4 text-right tabular-nums text-slate-600">{row.learnerCount}</td>
              <td className="px-5 py-4 tabular-nums text-slate-600">{row.lessonCount}</td>
              <td className="px-5 py-4">
                {row.completionRate === null ? (
                  <span className="text-slate-400">No lessons published</span>
                ) : (
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                      <span>{row.completionRate}% complete</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${row.courseTitle} completion`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={row.completionRate}
                      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${row.completionRate}%` }} />
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CourseAssessmentTable({ rows }: { rows: CourseAssessmentRow[] }) {
  if (!rows.length) {
    return <ReportEmptyState message="No lesson scores are available for this report yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Course</th>
            <th className="px-5 py-3 text-right">Scores recorded</th>
            <th className="w-72 px-5 py-3">Average score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.courseId}>
              <td className="px-5 py-4 font-medium text-slate-900">{row.courseTitle}</td>
              <td className="px-5 py-4 text-right tabular-nums text-slate-600">{row.gradedAssessments}</td>
              <td className="px-5 py-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                    <span>{row.averageScore}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${row.courseTitle} average score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={row.averageScore}
                    className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${row.averageScore}%` }} />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="font-medium text-slate-800">Nothing to report yet</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}
