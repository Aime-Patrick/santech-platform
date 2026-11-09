import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/lib/email/password-reset-email";

const schema = z.object({ email: z.email() });
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const GENERIC_RESPONSE = { message: "If an active account exists for that email, we’ll send a password reset link shortly." };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const now = new Date();
  const recentRequest = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: now }, createdAt: { gt: new Date(now.getTime() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recentRequest) return NextResponse.json(GENERIC_RESPONSE);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const resetToken = await prisma.$transaction(async (transaction) => {
    await transaction.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } });
    return transaction.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + TOKEN_LIFETIME_MS) },
      select: { id: true },
    });
  });

  try {
    const appUrl = getServerEnv().APP_URL.replace(/\/$/, "");
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetUrl });
  } catch (error) {
    await prisma.passwordResetToken.updateMany({ where: { id: resetToken.id, usedAt: null }, data: { usedAt: new Date() } });
    console.error("Password reset email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
