import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export const INVITATION_EXPIRY_DAYS = 7;

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiresAt() {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export function findValidInvitation(token: string) {
  return prisma.invitation.findFirst({
    where: {
      tokenHash: hashInvitationToken(token),
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      roles: { include: { role: { select: { id: true, name: true, key: true } } } },
    },
  });
}
