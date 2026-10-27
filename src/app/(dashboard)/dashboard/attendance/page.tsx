import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { requirePermission } from "@/lib/authorization/permissions";
import { getLearnerAttendance } from "@/lib/services/learning-service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type AttendanceRecord = {
  id: string;
  status: string;
  sessionDate: Date;
  cohort: { name: string; course: { title: string } };
  lesson: { title: string } | null;
};
export default async function AttendancePage() {
  const actor = await requirePermission("attendance.view");
  const records = await getLearnerAttendance(actor.id);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Review your attendance history across cohorts and learning sessions."
      />

      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-slate-100">
          {records.length === 0 ? (
            <div className="p-6">
              <CircleAlert className="size-6 text-[#00a3e0]" />
              <h2 className="mt-3 font-bold text-[#0a1f44]">No attendance records yet.</h2>
              <p className="mt-1 text-sm text-slate-500">
                Attendance will appear after an instructor records your first session.
              </p>
            </div>
          ) : (
            records.map((record: AttendanceRecord) => {
              const present = record.status === "PRESENT";
              const late = record.status === "LATE";
              return (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-[#0a1f44]">{record.cohort.course.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.cohort.name}
                      {record.lesson ? ` · ${record.lesson.title}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <time
                      className="text-xs text-slate-400"
                      dateTime={record.sessionDate.toISOString()}
                    >
                      {record.sessionDate.toLocaleDateString()}
                    </time>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        present
                          ? "text-emerald-700"
                          : late
                          ? "text-amber-700"
                          : "text-slate-500"
                      }`}
                    >
                      {present ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Clock3 className="size-4" />
                      )}
                      {record.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </section>
  );
}
