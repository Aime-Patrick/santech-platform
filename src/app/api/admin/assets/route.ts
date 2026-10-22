import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { uploadBufferToCloudinary } from "@/lib/storage/cloudinary";

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const folder = new URL(request.url).searchParams.get("folder") ?? undefined;
  const assets = await prisma.mediaAsset.findMany({ where: folder ? { publicId: { startsWith: `${folder}/` } } : undefined, orderBy: { createdAt: "desc" }, select: { id: true, publicId: true, url: true, alternativeText: true, format: true, width: true, height: true, bytes: true, createdAt: true } });
  return NextResponse.json({ data: assets });
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
