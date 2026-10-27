import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { destroyCloudinaryAsset, renameCloudinaryAsset, uploadBufferToCloudinary } from "@/lib/storage/cloudinary";

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
const params = new URL(request.url).searchParams;
  const folder = params.get("folder") ?? undefined;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") ?? "15") || 15));
  const where = folder ? { publicId: { startsWith: `${folder}/` } } : undefined;
  const assets = await prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize + 1, select: { id: true, publicId: true, url: true, alternativeText: true, caption: true, format: true, width: true, height: true, bytes: true, createdAt: true } });
  const hasMore = assets.length > pageSize;
  return NextResponse.json({ data: assets.slice(0, pageSize), page, pageSize, hasMore, nextPage: hasMore ? page + 1 : null });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "santech-platform/website-content");
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required" }, { status: 400 });
  const result = await uploadBufferToCloudinary({ data: Buffer.from(await file.arrayBuffer()), fileName: file.name, mimeType: file.type, folder });
  const asset = await prisma.mediaAsset.create({ data: { publicId: result.public_id, url: result.secure_url, provider: "cloudinary", format: result.resource_type, bytes: result.bytes } });
  return NextResponse.json({ data: asset }, { status: 201 });
}

export async function PUT(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData(); const id = String(form.get("id") ?? ""); const file = form.get("file");
  if (!id || !(file instanceof File)) return NextResponse.json({ error: "An asset id and replacement file are required" }, { status: 400 });
  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  const folder = existing.publicId.split("/").slice(0, -1).join("/") || "santech-platform/website-content";
  const result = await uploadBufferToCloudinary({ data: Buffer.from(await file.arrayBuffer()), fileName: file.name, mimeType: file.type, folder });
  const asset = await prisma.mediaAsset.update({ where: { id }, data: { publicId: result.public_id, url: result.secure_url, format: result.resource_type, bytes: result.bytes, width: result.width ?? null, height: result.height ?? null, alternativeText: null, caption: null } });
  try { await destroyCloudinaryAsset(existing.publicId, existing.format ?? "image"); } catch (error) { console.error("Failed to destroy replaced asset", error); }
  return NextResponse.json({ data: asset });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { action?: string; ids?: string[]; folder?: string; id?: string; alternativeText?: string | null; caption?: string | null } | null;
  if (body?.action === "move") {
    if (!body.ids?.length || !body.folder?.trim()) return NextResponse.json({ error: "Asset ids and destination folder are required" }, { status: 400 });
    const assets = await prisma.mediaAsset.findMany({ where: { id: { in: body.ids } } });
    const moved = [];
    for (const item of assets) {
      const name = item.publicId.split("/").pop() ?? item.publicId;
      const publicId = `${body.folder.replace(/\/+$/, "")}/${name}`;
      try { await renameCloudinaryAsset(item.publicId, publicId, item.format ?? "image"); } catch (error) { console.error("Cloudinary move failed; updating library path", error); }
      moved.push(await prisma.mediaAsset.update({ where: { id: item.id }, data: { publicId } }));
    }
    return NextResponse.json({ data: moved });
  }
  if (!body?.id) return NextResponse.json({ error: "An asset id is required" }, { status: 400 });
  const existing = await prisma.mediaAsset.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  const asset = await prisma.mediaAsset.update({
    where: { id: body.id },
    data: {
      ...(body.alternativeText !== undefined ? { alternativeText: body.alternativeText || null } : {}),
      ...(body.caption !== undefined ? { caption: body.caption || null } : {}),
    },
  });
  return NextResponse.json({ data: asset });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "An asset id is required" }, { status: 400 });
  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  await prisma.mediaAsset.delete({ where: { id } });
  try {
    await destroyCloudinaryAsset(existing.publicId, existing.format ?? "image");
  } catch (error) {
    // The database record is already gone; a failed provider cleanup should
    // not resurrect the asset. Surface it for operators instead.
    console.error("Failed to destroy Cloudinary asset", existing.publicId, error);
  }
  return NextResponse.json({ ok: true });
}
