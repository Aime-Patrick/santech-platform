import { NextResponse } from "next/server";
import { getPublicAppointment } from "@/lib/services/appointment-service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const appointment = await getPublicAppointment(slug);
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json({ data: appointment });
}
