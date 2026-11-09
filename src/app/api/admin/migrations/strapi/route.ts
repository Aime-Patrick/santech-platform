import { NextResponse } from "next/server";
import { requireAdministrator } from "@/lib/authorization/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DUMP_BYTES = 2 * 1024 * 1024 * 1024;

function workerConfig() {
  const url = process.env.STRAPI_MIGRATION_WORKER_URL?.replace(/\/$/, "");
  const token = process.env.STRAPI_MIGRATION_WORKER_TOKEN;
  if (!url || !token) throw new Error("The Strapi migration worker is not configured.");
  return { url, token };
}

function authError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed.";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 503;
  return NextResponse.json({ error: status === 503 ? message : "You are not authorized to manage Strapi migrations." }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdministrator();
    const { url, token } = workerConfig();
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_DUMP_BYTES) return NextResponse.json({ error: "Database dump exceeds the 2 GB upload limit." }, { status: 413 });
    const fileName = decodeURIComponent(request.headers.get("x-file-name") ?? "strapi-database.dump").replace(/[\\/\0]/g, "_");
    if (!/\.(dump|backup)$/i.test(fileName)) return NextResponse.json({ error: "Upload a PostgreSQL custom-format .dump or .backup file." }, { status: 415 });
    if (!request.body) return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    const upstream = await fetch(`${url}/v1/migrations/strapi`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
        "content-length": String(contentLength),
        "x-file-name": encodeURIComponent(fileName),
      },
      body: request.body,
      duplex: "half",
      cache: "no-store",
    } as RequestInit & { duplex: "half" });
    return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    return authError(error);
  }
}

export async function GET(request: Request) {
  try {
    await requireAdministrator();
    const { url, token } = workerConfig();
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (!jobId || !/^[a-zA-Z0-9_-]{8,100}$/.test(jobId)) return NextResponse.json({ error: "A valid migration job ID is required." }, { status: 400 });
    const upstream = await fetch(`${url}/v1/migrations/strapi/${encodeURIComponent(jobId)}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
    return new Response(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    return authError(error);
  }
}
