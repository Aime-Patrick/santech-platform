import { requirePermission } from "@/lib/authorization/permissions";
import { AppointmentCalendarWorkspace } from "@/components/appointments/appointment-calendar-workspace";

export default async function AppointmentsPage() {
  await requirePermission("appointments.view");
  return <AppointmentCalendarWorkspace />;
}
