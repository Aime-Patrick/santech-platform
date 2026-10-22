import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { createInvitationToken, invitationExpiresAt } from "@/lib/services/invitation-service";
import { sendInvitationEmail } from "@/lib/email/invitation-email";

const inviteSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  roleIds: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "users.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter the name, email, and at least one role." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const roleIds = [...new Set(parsed.data.roleIds)];
  const roles = await prisma.role.findMany({ where: { id: { in: roleIds }, isActive: true }, select: { id: true, name: true } });
  if (roles.length !== roleIds.length) return NextResponse.json({ error: "One or more selected roles are unavailable." }, { status: 400 });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.status !== "INVITED") {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
  }

  const { token, tokenHash } = createInvitationToken();
  const expiresAt = invitationExpiresAt();
  const invitation = await prisma.$transaction(async (transaction) => {
    const user = existingUser
      ? await transaction.user.update({ where: { id: existingUser.id }, data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, status: "INVITED", passwordHash: null } })
      : await transaction.user.create({ data: { email, firstName: parsed.data.firstName, lastName: parsed.data.lastName, status: "INVITED" } });

    await transaction.invitation.updateMany({ where: { userId: user.id, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const created = await transaction.invitation.create({
      data: {
        email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        tokenHash,
        expiresAt,
        invitedById: actor.id,
        userId: user.id,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
    });
    return { id: created.id, userId: user.id };
  });

  try {
    const env = getServerEnv();
    await sendInvitationEmail({
      to: email,
      firstName: parsed.data.firstName,
      roleNames: roles.map((role) => role.name),
      inviteUrl: `${env.APP_URL}/accept-invite?token=${encodeURIComponent(token)}`,
      expiresInDays: 7,
    });
  } catch (error) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
    console.error("Invitation email failed", error);
    return NextResponse.json({ error: "The invitation was not sent. Check the email provider configuration and try again." }, { status: 502 });
  }

  await recordAuditLog({ actorId: actor.id, action: "user.invited", entityType: "User", entityId: invitation.userId, metadata: { email, roleIds, invitationId: invitation.id } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
