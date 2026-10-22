import { getCurrentUser } from "@/lib/auth/session";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/services/dashboard-service";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const dashboard = await getDashboardData(user);
  return <DashboardClient userName={`${user.firstName} ${user.lastName}`.trim()} dashboard={dashboard} />;
}
