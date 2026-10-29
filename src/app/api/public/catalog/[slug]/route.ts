import { NextResponse } from "next/server";
import { getPublishedCatalogItem } from "@/lib/services/catalog-service";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const item = await getPublishedCatalogItem(slug);
  if (!item) return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
  return NextResponse.json({ data: item }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
