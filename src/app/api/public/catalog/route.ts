import { NextResponse } from "next/server";
import { listPublishedCatalogItems } from "@/lib/services/catalog-service";

export const revalidate = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

  try {
    const result = await listPublishedCatalogItems({
      category: url.searchParams.get("category") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      limit,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Failed to load public catalog", error);
    return NextResponse.json({ error: "Unable to load catalog" }, { status: 500 });
  }
}
