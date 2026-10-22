import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getServerEnv } from "@/lib/env";

const handoffSchema = z.object({
  iss: z.literal("santech-cms"),
  provider: z.literal("strapi-admin"),
  sub: z.string().min(1),
  email: z.email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  exp: z.number().int(),
  jti: z.string().min(16).max(100),
});

function verifyToken(token: string, secret: string) {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;
  const expected = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  const receivedBytes = Buffer.from(encodedSignature);
  const expectedBytes = Buffer.from(expected);
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) return null;
  try {
    return handoffSchema.parse(JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const env = getServerEnv();
  if (!env.CMS_SSO_SECRET) return NextResponse.json({ error: "CMS SSO is not configured" }, { status: 503 });
  const token = new URL(request.url).searchParams.get("token");
  const handoff = token ? verifyToken(token, env.CMS_SSO_SECRET) : null;
  if (!handoff || handoff.exp <= Math.floor(Date.now() / 1000)) return NextResponse.json({ error: "The sign-in link is invalid or expired" }, { status: 401 });

  try {
    await prisma.ssoExchange.create({ data: { id: handoff.jti, provider: handoff.provider, expiresAt: new Date(handoff.exp * 1000) } });
  } catch {
    return NextResponse.json({ error: "This sign-in link has already been used" }, { status: 409 });
  }

  const normalizedEmail = handoff.email.toLowerCase();
  const administratorRole = await prisma.role.findUnique({ where: { key: "administrator" }, select: { id: true } });
  if (!administratorRole) return NextResponse.json({ error: "Platform administrator role is not configured" }, { status: 500 });

  const user = await prisma.$transaction(async (transaction) => {
    const identity = await transaction.externalIdentity.findUnique({ where: { provider_subject: { provider: handoff.provider, subject: handoff.sub } }, select: { userId: true } });
    const account = identity ? await transaction.user.update({ where: { id: identity.userId }, data: { email: normalizedEmail, firstName: handoff.firstName, lastName: handoff.lastName, status: "ACTIVE" } }) : await transaction.user.upsert({ where: { email: normalizedEmail }, update: { firstName: handoff.firstName, lastName: handoff.lastName, status: "ACTIVE" }, create: { email: normalizedEmail, firstName: handoff.firstName, lastName: handoff.lastName } });
    await transaction.externalIdentity.upsert({ where: { provider_subject: { provider: handoff.provider, subject: handoff.sub } }, update: { userId: account.id }, create: { provider: handoff.provider, subject: handoff.sub, userId: account.id } });
    await transaction.userRole.upsert({ where: { userId_roleId: { userId: account.id, roleId: administratorRole.id } }, update: { assignedBy: account.id }, create: { userId: account.id, roleId: administratorRole.id, assignedBy: account.id } });
    return account;
  });

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", env.APP_URL));
}
