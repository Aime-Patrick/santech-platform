import { NextResponse } from "next/server";
import { isPublicCmsContentType, listPublishedCmsEntries } from "@/lib/services/cms-content-service";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ contentType: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { contentType } = await context.params;
  if (!isPublicCmsContentType(contentType)) {
    return NextResponse.json({ error: "Content type is not public" }, { status: 404 });
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(rawLimit) ? rawLimit : 100;
  const result = await listPublishedCmsEntries(contentType, {
    slug: url.searchParams.get("slug") ?? undefined,
    limit,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
