import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EnrollmentReviewTable } from "@/components/enrollments/enrollment-review-table";

export default async function EnrollmentReviewPage() {
  await requirePermission("enrollments.review");
  const enrollments = await prisma.enrollment.findMany({ orderBy: { appliedAt: "desc" }, include: { learner: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true } }, cohort: { select: { name: true } } } });
  return <section className="mx-auto max-w-7xl space-y-6"><PageHeader title="Enrollment review" description="Review learner requests, update access status, and notify learners automatically." /><Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm"><EnrollmentReviewTable enrollments={enrollments} /></Card></section>;
}