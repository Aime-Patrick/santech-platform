import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";

function validFolderPath(path: string) {
  return path.length > 0 && path.length <= 255 && path.split("/").every((segment) =>
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    /^[\p{L}\p{N} _.-]+$/u.test(segment),
  );
}

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const parent = (params.get("parent") ?? "").replace(/^\/+|\/+$/g, "");
  const all = params.get("all") === "true";
  const data = await prisma.mediaFolder.findMany({
    where: all ? undefined : { parentPath: parent },
    orderBy: [{ name: "asc" }, { path: "asc" }],
    select: { name: true, path: true, parentPath: true },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { name?: unknown; parent?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const parentPath = typeof body?.parent === "string" ? body.parent.trim().replace(/^\/+|\/+$/g, "") : "";
  const path = [parentPath, name].filter(Boolean).join("/");
  if (!name || name.includes("/") || !validFolderPath(path)) {
    return NextResponse.json({ error: "Enter a folder name using letters, numbers, spaces, dashes, or underscores." }, { status: 400 });
  }
  if (parentPath && !(await prisma.mediaFolder.findUnique({ where: { path: parentPath }, select: { id: true } }))) {
    return NextResponse.json({ error: "The parent folder no longer exists." }, { status: 404 });
  }

  try {
    const folder = await prisma.mediaFolder.create({ data: { name, path, parentPath }, select: { name: true, path: true, parentPath: true } });
    return NextResponse.json({ data: folder }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A folder with this name already exists here." }, { status: 409 });
    }
    console.error("Failed to create media folder", error);
    return NextResponse.json({ error: "The folder could not be created. Please try again." }, { status: 500 });
  }
}
