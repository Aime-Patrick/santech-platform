import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { createAppointmentType, listAppointmentTypes } from "@/lib/services/appointment-service";

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "appointments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listAppointmentTypes(actor.id) });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "appointments.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.slug || !Array.isArray(body.availability)) return NextResponse.json({ error: "Title, slug, and availability are required" }, { status: 400 });
  try {
    const data = await createAppointmentType({ hostId: actor.id, title: String(body.title), slug: String(body.slug).toLowerCase().trim(), description: body.description ? String(body.description) : undefined, durationMinutes: Number(body.durationMinutes) || 30, timezone: String(body.timezone || "Africa/Kigali"), locationLabel: body.locationLabel ? String(body.locationLabel) : undefined, locationUrl: body.locationUrl ? String(body.locationUrl) : undefined, availability: body.availability });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create appointment" }, { status: 400 });
  }
}
