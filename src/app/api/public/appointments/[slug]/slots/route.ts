import { NextResponse } from "next/server";
import { getAppointmentSlots } from "@/lib/services/appointment-service";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const days = Math.min(14, Math.max(1, Number(url.searchParams.get("days") ?? "7") || 7));
  const result = await getAppointmentSlots(slug, fromDate, days);
  if (!result) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json({ data: result });
}
