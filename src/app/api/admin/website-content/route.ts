import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const contentType = url.searchParams.get("contentType") ?? undefined;
  const id = url.searchParams.get("id") ?? undefined;
  const entries = await prisma.cmsEntry.findMany({
    where: id ? { id } : contentType ? { contentType } : undefined,
    orderBy: [{ contentType: "asc" }, { sourceUpdatedAt: "desc" }],
    select: { id: true, contentType: true, sourceId: true, sourceDocumentId: true, slug: true, title: true, status: true, sourceUpdatedAt: true, payload: true },
  });
  return NextResponse.json({ data: entries });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { id?: string; title?: string; slug?: string | null; status?: string; payload?: unknown };
  if (!body.id || !body.title?.trim() || !body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) return NextResponse.json({ error: "Invalid content entry" }, { status: 400 });
  const status = body.status === "PUBLISHED" || body.status === "ARCHIVED" ? body.status : "DRAFT";
  const entry = await prisma.cmsEntry.update({ where: { id: body.id }, data: { title: body.title.trim(), slug: body.slug?.trim() || null, status, payload: body.payload as never, publishedAt: status === "PUBLISHED" ? new Date() : null } });
  const { recordAuditLog } = await import("@/lib/services/audit-service");
  await recordAuditLog({ actorId: actor.id, action: `cms_entry.${status.toLowerCase()}`, entityType: "CmsEntry", entityId: entry.id, metadata: { contentType: entry.contentType, title: entry.title } });
  return NextResponse.json({ data: entry });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { contentType?: string; title?: string; slug?: string | null; payload?: unknown };
  if (!body.contentType || !body.title?.trim() || !body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) return NextResponse.json({ error: "Invalid content entry" }, { status: 400 });
  const sourceDocumentId = `platform-${body.contentType}-${crypto.randomUUID()}`;
  const entry = await prisma.cmsEntry.create({ data: { contentType: body.contentType, sourceDocumentId, title: body.title.trim(), slug: body.slug?.trim() || null, status: "DRAFT", payload: body.payload as never } });
  const { recordAuditLog } = await import("@/lib/services/audit-service");
  await recordAuditLog({ actorId: actor.id, action: "cms_entry.created", entityType: "CmsEntry", entityId: entry.id, metadata: { contentType: entry.contentType, title: entry.title } });
  return NextResponse.json({ data: entry }, { status: 201 });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Entry id is required" }, { status: 400 });
  await prisma.cmsEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
