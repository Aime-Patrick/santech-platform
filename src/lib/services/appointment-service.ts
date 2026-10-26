import { prisma } from "@/lib/db/prisma";
const db = prisma as any;

export type AvailabilityInput = { weekday: number; startMinute: number; endMinute: number };

function zonedDateToUtc(date: string, minute: number, timeZone: string) {
  const hour = Math.floor(minute / 60);
  const mins = minute % 60;
  const guess = new Date(date + "T" + String(hour).padStart(2, "0") + ":" + String(mins).padStart(2, "0") + ":00Z");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const rendered = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  return new Date(guess.getTime() - (rendered - guess.getTime()));
}

function weekdayFor(date: string, timeZone: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { timeZone, weekday: "short" });
}

const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export async function listAppointmentTypes(hostId?: string) {
  return db.appointmentType.findMany({ where: hostId ? { hostId } : undefined, include: { availability: true, _count: { select: { bookings: true } } }, orderBy: { createdAt: "desc" } });
}

export async function createAppointmentType(input: { hostId: string; title: string; slug: string; description?: string; durationMinutes: number; timezone: string; locationLabel?: string; locationUrl?: string; availability: AvailabilityInput[] }) {
  return db.appointmentType.create({ data: { hostId: input.hostId, title: input.title, slug: input.slug, description: input.description, durationMinutes: input.durationMinutes, timezone: input.timezone, locationLabel: input.locationLabel, locationUrl: input.locationUrl, availability: { create: input.availability } }, include: { availability: true } });
}

export async function getPublicAppointment(slug: string) {
  return db.appointmentType.findFirst({ where: { slug, status: "PUBLISHED" }, include: { availability: true, host: { select: { firstName: true, lastName: true } } } });
}

export async function getAppointmentSlots(slug: string, fromDate: string, days = 7) {
  const appointment = await getPublicAppointment(slug);
  if (!appointment) return null;
  const now = new Date();
  const slots: Array<{ startsAt: string; endsAt: string; date: string; time: string }> = [];
  const booked = await db.appointmentBooking.findMany({ where: { appointmentTypeId: appointment.id, status: "CONFIRMED", startsAt: { gte: now } }, select: { startsAt: true } });
  const bookedTimes = new Set(booked.map((booking: any) => booking.startsAt.toISOString()));
  const start = new Date(fromDate + "T12:00:00Z");
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start); day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    const weekday = weekdayIndex[weekdayFor(date, appointment.timezone)];
    for (const window of appointment.availability.filter((item: any) => item.weekday === weekday)) {
      for (let minute = window.startMinute; minute + appointment.durationMinutes <= window.endMinute; minute += appointment.durationMinutes) {
        const startsAt = zonedDateToUtc(date, minute, appointment.timezone);
        const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60_000);
        if (startsAt <= now || bookedTimes.has(startsAt.toISOString())) continue;
        slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), date, time: new Intl.DateTimeFormat("en-US", { timeZone: appointment.timezone, hour: "numeric", minute: "2-digit" }).format(startsAt) });
      }
    }
  }
  return { appointment, fromDate, days, timezone: appointment.timezone, slots };
}

export async function createBooking(input: { slug: string; startsAt: string; attendeeName: string; attendeeEmail: string; timezone: string; notes?: string; attendeeId?: string }) {
  const appointment = await getPublicAppointment(input.slug);
  if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) throw new Error("SLOT_IN_PAST");
  const slots = await getAppointmentSlots(input.slug, startsAt.toISOString().slice(0, 10), 1);
  if (!slots?.slots.some((slot) => slot.startsAt === startsAt.toISOString())) throw new Error("SLOT_UNAVAILABLE");
  return db.appointmentBooking.create({ data: { appointmentTypeId: appointment.id, startsAt, endsAt: new Date(startsAt.getTime() + appointment.durationMinutes * 60_000), attendeeName: input.attendeeName, attendeeEmail: input.attendeeEmail.toLowerCase(), timezone: input.timezone, notes: input.notes, attendeeId: input.attendeeId } });
}
