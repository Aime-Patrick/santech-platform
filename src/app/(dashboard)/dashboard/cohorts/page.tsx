import { Users } from "lucide-react";
import { CohortsDataTable } from "@/components/cohorts/cohorts-data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/authorization/permissions";
import { listInstructorCohorts } from "@/lib/services/instructor-service";

export default async function CohortsPage() {
  const actor = await getCurrentUser();
  if (!actor || !hasAnyPermission(actor, ["cohorts.manage", "attendance.mark"])) {
    return (
      <EmptyState
        icon={Users}
        eyebrow="Access boundary"
        title="Instructor operations unavailable"
        description="You do not have access to instructor operations. Ask an administrator to assign cohort access."
      />
    );
  }

  const includeAll = actor.roles.some(({ role }) => role.key === "administrator");
  const cohorts = await listInstructorCohorts(actor.id, includeAll);
  const activeCount = cohorts.filter((cohort) => cohort.status === "ACTIVE").length;
  const totalLearners = cohorts.reduce((sum, cohort) => sum + cohort._count.members, 0);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Cohorts"
        description="Open an assigned cohort to mark attendance and maintain learner grades."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cohorts" value={cohorts.length} icon={Users} badge={`${activeCount} active`} />
        <StatCard label="Active cohorts" value={activeCount} icon={Users} badge="In session" />
        <StatCard label="Total learners" value={totalLearners} icon={Users} badge="Assigned" />
      </div>

      <CohortsDataTable cohorts={cohorts} />
    </section>
  );
}
