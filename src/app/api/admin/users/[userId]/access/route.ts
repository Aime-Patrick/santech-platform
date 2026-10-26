import { NextResponse } from "next/server";
import { updateUserAccess } from "@/app/(dashboard)/dashboard/users/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.status !== "string" || !Array.isArray(body.roleIds)) return NextResponse.json({ error: "Invalid user access payload." }, { status: 400 });
  const formData = new FormData();
  formData.set("status", body.status);
  body.roleIds.filter((id: unknown): id is string => typeof id === "string").forEach((id: string) => formData.append("roleIds", id));
  try { await updateUserAccess(userId, formData); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update user access." }, { status: 400 }); }
}
