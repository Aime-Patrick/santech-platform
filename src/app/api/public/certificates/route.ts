import { NextResponse } from "next/server";
import { getPublicCertificates } from "@/lib/services/cms-content-service";

export const revalidate = 3600;

export async function GET() {
  try { return NextResponse.json({ data: await getPublicCertificates() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }); }
  catch (error) { console.error("Failed to load public certificates", error); return NextResponse.json({ error: "Unable to load certificates" }, { status: 500 }); }
}
