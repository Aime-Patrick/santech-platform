import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { createInvitationToken, invitationExpiresAt } from "@/lib/services/invitation-service";
import { sendInvitationEmail } from "@/lib/email/invitation-email";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email(),
  phone: z.string().trim().max(40).optional(),
  gender: z.string().trim().max(40).optional(),
  courses: z.string().trim().max(1000).optional(),
  other: z.string().trim().max(3000).optional(),
  schoolInstitution: z.string().trim().max(200).optional(),
  location: z.string().trim().max(160).optional(),
  nationality: z.string().trim().max(100).optional(),
  skillsTopics: z.string().trim().min(10).max(5000),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.PUBLIC_SITE_URL ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const parsed = inquirySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Complete the required training fields." }, { status: 400, headers: corsHeaders() });
  }

  const [firstName, ...rest] = parsed.data.name.split(/\s+/);
  const lastName = rest.join(" ") || firstName;
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const payload = parsed.data;
  const title = `Training inquiry from ${firstName} ${lastName}`;
  let setupUrl: string | null = null;

  if (!existing) {
    const learnerRole = await prisma.role.findUnique({ where: { key: "learner" }, select: { id: true, name: true } });
    if (!learnerRole) {
      return NextResponse.json({ error: "Learner registration is not configured yet." }, { status: 503, headers: corsHeaders() });
    }
    const { token, tokenHash } = createInvitationToken();
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, firstName, lastName, status: "INVITED" } });
      const invitation = await tx.invitation.create({ data: { email, firstName, lastName, tokenHash, expiresAt: invitationExpiresAt(), userId: user.id, roles: { create: [{ roleId: learnerRole.id }] } } });
      await tx.cmsEntry.create({ data: { contentType: "training-inquiry", title, status: "NEW", payload } });
      await tx.application.create({ data: { applicantId: user.id, type: "TRAINING", status: "SUBMITTED", submittedAt: new Date(), coverLetter: JSON.stringify(payload) } });
      return { userId: user.id, invitationId: invitation.id };
    });
    setupUrl = `${getServerEnv().APP_URL.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(token)}`;
    try {
      await sendInvitationEmail({ to: email, firstName, roleNames: [learnerRole.name], inviteUrl: setupUrl, expiresInDays: 7 });
    } catch (error) {
      console.error("[training-inquiries] Invitation email failed:", error);
      await prisma.invitation.update({ where: { id: created.invitationId }, data: { revokedAt: new Date() } });
      return NextResponse.json({ error: "We could not send the account setup email." }, { status: 502, headers: corsHeaders() });
    }
  } else {
    await prisma.$transaction([
      prisma.cmsEntry.create({ data: { contentType: "training-inquiry", title, status: "NEW", payload } }),
      prisma.application.create({ data: { applicantId: existing.id, type: "TRAINING", status: "SUBMITTED", submittedAt: new Date(), coverLetter: JSON.stringify(payload) } }),
    ]);
  }

  return NextResponse.json({ ok: true, setupRequired: Boolean(setupUrl), message: setupUrl ? "Your request was received. Check your email to finish creating your learner account." : "Your request was received. Sign in to your learner account to continue." }, { status: 201, headers: corsHeaders() });
}
