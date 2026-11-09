import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdministrator } from "@/lib/authorization/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({ jobId: z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/) });

export async function POST(request: Request) {
  try {
    await requireAdministrator();
    const url = process.env.STRAPI_MIGRATION_WORKER_URL?.replace(/\/$/, "");
    const token = process.env.STRAPI_MIGRATION_WORKER_TOKEN;
    if (!url || !token) return NextResponse.json({ error: "The Strapi migration worker is not configured." }, { status: 503 });
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "A valid migration job ID is required." }, { status: 400 });
    const upstream = await fetch(`${url}/v1/migrations/strapi/${encodeURIComponent(parsed.data.jobId)}/import`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? message : "You are not authorized to manage Strapi migrations." }, { status });
  }
}
