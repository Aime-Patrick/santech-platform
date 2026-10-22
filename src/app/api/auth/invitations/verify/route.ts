import { NextResponse } from "next/server";
import { findValidInvitation } from "@/lib/services/invitation-service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Invitation token is required." }, { status: 400 });

  const invitation = await findValidInvitation(token);
  if (!invitation) return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 410 });

  return NextResponse.json({
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    roles: invitation.roles.map(({ role }) => role.name),
    expiresAt: invitation.expiresAt.toISOString(),
  });
}
