import { CohortMemberOperations } from "@/components/cohorts/cohort-member-operations";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { getCohortGrades, getInstructorCohort } from "@/lib/services/instructor-service";
import { markAttendance, saveGrade } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CohortMemberRecord = {
  learner: { id: string; firstName: string; lastName: string; email: string };
};
type AttendanceRecord = { learner: { id: string }; status: string; lesson: { id: string; title: string } | null };
type GradeRecord = { learner: { id: string }; lesson: { id: string; title: string }; score: number; feedback: string | null };
export default async function CohortDetailPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;
  const actor = await getCurrentUser();
  if (!actor || !hasPermission(actor, "attendance.mark")) notFound();
  const includeAll = actor.roles.some((userRole: { role: { key: string } }) => userRole.role.key === "administrator");
  const cohort = await getInstructorCohort(cohortId, actor.id, includeAll);
  if (!cohort) notFound();
  const grades = await getCohortGrades(cohort.courseId, cohort.members.map((member: CohortMemberRecord) => member.learner.id));
  const canGrade = hasPermission(actor, "grades.manage");
  const today = new Date().toISOString().slice(0, 10);
  return <section className="space-y-6"><Link href="/dashboard/cohorts" className="text-xs font-bold text-[#0a1f44] hover:text-[#00a3e0]">← Back to cohorts</Link><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a3e0]">{cohort.course.title} / Instructor operations</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#0a1f44]">{cohort.name}</h1><p className="mt-2 text-sm text-slate-500">{cohort.members.length} learners · {cohort.status.toLowerCase()}</p></div><Card className="overflow-hidden p-0"><div className="border-b border-slate-200 bg-[#f3f8fc] px-5 py-4"><div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-[#00a3e0]" /><h2 className="font-bold text-[#0a1f44]">Attendance and grading roster</h2></div></div><div className="divide-y divide-slate-100">{cohort.members.length === 0 ? <p className="p-6 text-sm text-slate-500">No learners have been assigned to this cohort.</p> : cohort.members.map((member: CohortMemberRecord) => {
    const { learner } = member; const latestAttendance = cohort.attendance.find((record: AttendanceRecord) => record.learner.id === learner.id); const learnerGrades = grades.filter((grade: GradeRecord) => grade.learner.id === learner.id); return <div key={learner.id} className="grid gap-5 p-5 xl:grid-cols-[minmax(190px,0.7fr)_minmax(360px,1.3fr)_minmax(360px,1.3fr)] xl:items-start"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#e7f4fb] text-[#0a1f44]"><Users className="size-4" /></span><p className="font-bold text-[#0a1f44]">{learner.firstName} {learner.lastName}</p></div><p className="mt-2 text-xs text-slate-500">{learner.email}</p>{latestAttendance ? <p className="mt-3 text-xs text-slate-500">Latest: <span className="font-bold text-[#0a1f44]">{latestAttendance.status}</span></p> : null}</div><CohortMemberOperations cohortId={cohort.id} learnerId={learner.id} lessons={cohort.course.lessons} attendance={latestAttendance ? { status: latestAttendance.status, lesson: latestAttendance.lesson } : undefined} grade={learnerGrades[0] ? { lesson: learnerGrades[0].lesson, score: learnerGrades[0].score, feedback: learnerGrades[0].feedback } : undefined} canGrade={canGrade} /></div>; })}</div></Card></section>;
}
