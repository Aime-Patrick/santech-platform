import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/services/cms-content-service";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: await getPublicSiteSettings() }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
