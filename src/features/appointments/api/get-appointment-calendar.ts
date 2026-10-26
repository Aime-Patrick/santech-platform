export type AppointmentCalendarEvent = {
  id: string;
  startsAt: string;
  endsAt: string;
  attendeeName: string;
  attendeeEmail: string;
  status: "CONFIRMED" | "CANCELLED";
  appointmentType: { id: string; title: string; slug: string; timezone: string };
};

export async function getAppointmentCalendar(input: { from: string; to: string }) {
  const params = new URLSearchParams(input);
  const response = await fetch(`/api/admin/appointments/calendar?${params.toString()}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load calendar events");
  return payload as { data: AppointmentCalendarEvent[] };
}
