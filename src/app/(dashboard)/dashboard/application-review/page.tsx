import { ClipboardList } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { listApplicationsForReview } from "@/lib/services/application-service";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationReviewTable } from "@/components/applications/application-review-table";

export default async function ApplicationReviewPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "applications.review")) return <EmptyState icon={ClipboardList} title="Application review is restricted" description="You do not have permission to review learner applications." />;
  const applications = await listApplicationsForReview();
  return <section className="mx-auto w-full max-w-7xl space-y-6"><PageHeader title="Application management" description="Review learner submissions using the shared data table." /><ApplicationReviewTable applications={applications} /></section>;
}
