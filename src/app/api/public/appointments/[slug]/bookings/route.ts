import { NextResponse } from "next/server";
import { createBooking } from "@/lib/services/appointment-service";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.startsAt || !body?.attendeeName || !body?.attendeeEmail || !body?.timezone) return NextResponse.json({ error: "Name, email, timezone, and time are required" }, { status: 400 });
  try {
    const booking = await createBooking({ slug, startsAt: String(body.startsAt), attendeeName: String(body.attendeeName), attendeeEmail: String(body.attendeeEmail), timezone: String(body.timezone), notes: body.notes ? String(body.notes) : undefined });
    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "BOOKING_FAILED";
    const status = code === "APPOINTMENT_NOT_FOUND" ? 404 : code === "SLOT_UNAVAILABLE" || code === "SLOT_IN_PAST" ? 409 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
