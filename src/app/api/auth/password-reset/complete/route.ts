import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE } from "@/lib/auth/session";

const schema = z.object({ token: z.string().min(32).max(200), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use a valid reset link and a password of 8–128 characters." }, { status: 400 });

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  try {
    await prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
      if (!resetToken) throw new Error("INVALID_RESET_TOKEN");

      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new Error("INVALID_RESET_TOKEN");

      await transaction.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await transaction.session.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: now } });
      await transaction.passwordResetToken.updateMany({ where: { userId: resetToken.userId, usedAt: null }, data: { usedAt: now } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return NextResponse.json({ error: "This reset link is invalid, expired, or already used. Request a new one." }, { status: 410 });
    }
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ message: "Your password has been reset. You can now sign in." });
}
