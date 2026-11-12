import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader, DashboardHeaderProvider } from "@/components/layout/dashboard-header";
import { RouteTransition } from "@/components/layout/route-transition";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { requireCurrentUser } from "@/lib/auth/session";
import { getPermissionKeys } from "@/lib/authorization/permissions";
import { getLearnerDashboard } from "@/lib/services/learning-service";
import { getSidebarAnalyticsHighlights } from "@/lib/services/sidebar-analytics-service";

type DashboardRole = { role: { isActive: boolean; name: string; key: string } };
type LearnerTrack = Awaited<ReturnType<typeof getLearnerDashboard>>[number];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  const permissions: string[] = getPermissionKeys(user).map(String);
  const roles: string[] = user.roles.filter((entry: DashboardRole) => entry.role.isActive).map((entry: DashboardRole) => String(entry.role.name));
  const userName = `${user.firstName} ${user.lastName}`;
  const activeRoleKeys: string[] = user.roles.filter((entry: DashboardRole) => entry.role.isActive).map((entry: DashboardRole) => String(entry.role.key));
  const isLearner = activeRoleKeys.includes("learner");
  const isAdministrator = activeRoleKeys.includes("administrator");
  const learnerTracks = isLearner ? (await getLearnerDashboard(user.id)).filter((item: LearnerTrack) => !["REJECTED", "WITHDRAWN"].includes(item.status)).map((item: LearnerTrack) => ({ id: item.course.id, title: item.course.title })) : [];
  const analyticsHighlights = permissions.some((permission) => ["attendance.view", "grades.view"].includes(permission))
    ? await getSidebarAnalyticsHighlights(user)
    : null;

  return (
    <PermissionProvider permissions={permissions} roles={roles}>
      <DashboardHeaderProvider>
        <div className="dashboard-white-surface flex h-svh w-full overflow-hidden bg-background text-slate-900">
          <AppSidebar permissions={permissions} isLearner={isLearner} isAdministrator={isAdministrator} learnerTracks={learnerTracks} analyticsHighlights={analyticsHighlights} />
          <div id="snap-main-container" className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <DashboardHeader userName={userName} roles={roles} />
            <main className="min-h-full w-full bg-background px-4 pt-2 sm:px-6 lg:px-8">
              <RouteTransition>{children}</RouteTransition>
            </main>
          </div>
        </div>
      </DashboardHeaderProvider>
    </PermissionProvider>
  );
}
