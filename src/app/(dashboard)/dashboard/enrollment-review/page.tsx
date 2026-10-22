import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateEnrollmentStatus } from "./actions";

function statusTone(status: string) {
  if (status === "APPROVED" || status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED" || status === "WITHDRAWN") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export default async function EnrollmentReviewPage() {
  await requirePermission("enrollments.review");
  const enrollments = await prisma.enrollment.findMany({ orderBy: { appliedAt: "desc" }, include: { learner: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true } }, cohort: { select: { name: true } } } });
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Enrollment review" description="Review learner requests, update access status, and notify learners automatically." />
      <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-4">Learner</th><th className="px-5 py-4">Course</th><th className="px-5 py-4">Applied</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Update</th></tr></thead><tbody className="divide-y divide-slate-100">{enrollments.map((item) => <tr key={item.id} className="align-middle"><td className="px-5 py-4"><p className="font-semibold text-slate-950">{item.learner.firstName} {item.learner.lastName}</p><p className="mt-1 text-xs text-slate-500">{item.learner.email}</p></td><td className="px-5 py-4 font-medium text-slate-700">{item.course.title}{item.cohort ? <span className="mt-1 block text-xs text-slate-500">{item.cohort.name}</span> : null}</td><td className="px-5 py-4 text-slate-500">{item.appliedAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</td><td className="px-5 py-4"><Badge className={`border-0 ${statusTone(item.status)}`}>{item.status}</Badge></td><td className="px-5 py-4"><form action={updateEnrollmentStatus.bind(null, item.id)} className="flex justify-end gap-2"><select name="status" defaultValue={item.status} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="ACTIVE">Active</option><option value="REJECTED">Rejected</option><option value="WITHDRAWN">Withdrawn</option></select><button type="submit" className="h-9 rounded-md bg-[#123568] px-3 text-xs font-semibold text-white hover:bg-[#0a1f44]">Save</button></form></td></tr>)}</tbody></table>{enrollments.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No enrollment requests yet.</p> : null}</div>
      </Card>
    </section>
  );
}