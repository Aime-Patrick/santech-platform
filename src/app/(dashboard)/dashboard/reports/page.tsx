import { LearnersReport } from "@/components/reports/learners-report";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/authorization/permissions";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Reports - Learners Progress | SAN TECH",
  description: "View and track learning progress by learner, cohort, and course.",
};

export default async function ReportsPage() {
  const actor = await getCurrentUser();
  if (!actor || !hasAnyPermission(actor, ["enrollments.review"])) {
    return <EmptyState icon={BarChart3} title="Reports are restricted" description="You need enrollment review access to see learner progress reports." />;
  }

  return (
    <section className="space-y-6">
      <LearnersReport />
    </section>
  );
}
