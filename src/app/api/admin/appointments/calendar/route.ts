import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "appointments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const from = new Date(searchParams.get("from") ?? "");
  const to = new Date(searchParams.get("to") ?? "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    return NextResponse.json({ error: "A valid from/to date range is required" }, { status: 400 });
  }
  if (to.getTime() - from.getTime() > 93 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Calendar range cannot exceed 93 days" }, { status: 400 });
  }

  const data = await prisma.appointmentBooking.findMany({
    where: {
      appointmentType: { hostId: actor.id },
      status: "CONFIRMED",
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      attendeeName: true,
      attendeeEmail: true,
      status: true,
      appointmentType: { select: { id: true, title: true, slug: true, timezone: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ data });
}
