import { requireCurrentUser } from "@/lib/auth/session";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const dashboard = await getDashboardData(user);

  return <DashboardClient dashboard={dashboard} />;
}
