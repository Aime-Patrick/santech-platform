import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hashInvitationToken } from "@/lib/services/invitation-service";

const acceptSchema = z.object({
  token: z.string().min(20),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = acceptSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter your name and a password of at least 8 characters." }, { status: 400 });

  const now = new Date();
  const invitation = await prisma.invitation.findFirst({
    where: { tokenHash: hashInvitationToken(parsed.data.token), acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
    include: { roles: { select: { roleId: true } } },
  });
  if (!invitation) return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 410 });

  let userId = "";
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const result = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now },
      });
      if (claimed.count !== 1) throw new Error("INVITATION_ALREADY_USED");

      const user = await transaction.user.update({ where: { id: invitation.userId }, data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, passwordHash, status: "ACTIVE" } });
      await transaction.userRole.deleteMany({ where: { userId: user.id } });
      await transaction.userRole.createMany({ data: invitation.roles.map(({ roleId }) => ({ userId: user.id, roleId, assignedBy: invitation.invitedById })) });
      await transaction.auditLog.create({ data: { actorId: user.id, action: "user.invitation.accepted", entityType: "User", entityId: user.id, metadata: { invitationId: invitation.id } } });
      return user;
    });
    userId = result.id;
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_ALREADY_USED") return NextResponse.json({ error: "This invitation has already been used." }, { status: 409 });
    throw error;
  }

  await createSession(userId, true);
  return NextResponse.json({ ok: true });
}
