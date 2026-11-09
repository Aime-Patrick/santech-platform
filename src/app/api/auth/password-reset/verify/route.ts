import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token || token.length > 200) return NextResponse.json({ valid: false });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { expiresAt: true, usedAt: true, user: { select: { status: true } } },
  });
  const valid = Boolean(record && !record.usedAt && record.expiresAt > new Date() && record.user.status === "ACTIVE");
  return NextResponse.json({ valid });
}
