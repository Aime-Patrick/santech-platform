import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { RouteTransition } from "@/components/layout/route-transition";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getPermissionKeys } from "@/lib/authorization/permissions";
import { getLearnerDashboard } from "@/lib/services/learning-service";

type DashboardRole = { role: { isActive: boolean; name: string; key: string } };
type LearnerTrack = Awaited<ReturnType<typeof getLearnerDashboard>>[number];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const permissions = getPermissionKeys(user);
  const roles: string[] = user.roles.filter((entry: DashboardRole) => entry.role.isActive).map((entry: DashboardRole) => String(entry.role.name));
  const userName = `${user.firstName} ${user.lastName}`;
  const activeRoleKeys: string[] = user.roles.filter((entry: DashboardRole) => entry.role.isActive).map((entry: DashboardRole) => String(entry.role.key));
  const isLearner = activeRoleKeys.includes("learner");
  const learnerTracks = isLearner ? (await getLearnerDashboard(user.id)).filter((item: LearnerTrack) => !["REJECTED", "WITHDRAWN"].includes(item.status)).map((item: LearnerTrack) => ({ id: item.course.id, title: item.course.title })) : [];

  return (
    <PermissionProvider permissions={permissions} roles={roles}>
      <div className="flex h-svh w-full overflow-hidden bg-background text-slate-900">
        <AppSidebar permissions={permissions} userName={userName} roles={roles} isLearner={isLearner} learnerTracks={learnerTracks} />
        <div id="snap-main-container" className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="min-h-full w-full px-4 py-8 sm:px-6 lg:px-8">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
