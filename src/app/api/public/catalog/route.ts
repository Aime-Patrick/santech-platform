import { NextResponse } from "next/server";
import { listPublishedCatalogItems } from "@/lib/services/catalog-service";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawPageSize = Number(url.searchParams.get("pageSize") ?? "24");
  const page = Number.isFinite(rawPage) ? Math.max(Math.floor(rawPage), 1) : 1;
  const pageSize = Number.isFinite(rawPageSize) ? Math.max(Math.floor(rawPageSize), 1) : 24;

  try {
    const result = await listPublishedCatalogItems({
      category: url.searchParams.get("category") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      page,
      pageSize,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Failed to load public catalog", error);
    return NextResponse.json({ error: "Unable to load catalog" }, { status: 500 });
  }
}
