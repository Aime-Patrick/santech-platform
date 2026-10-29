import { NextResponse } from "next/server";
import { getPublicContactInfo } from "@/lib/services/cms-content-service";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ data: await getPublicContactInfo() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("Failed to load public contact info", error);
    return NextResponse.json({ error: "Unable to load contact info" }, { status: 500 });
  }
}
