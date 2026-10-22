import { getServerEnv } from "@/lib/env";

type InvitationEmail = {
  to: string;
  firstName: string;
  roleNames: string[];
  inviteUrl: string;
  expiresInDays: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function sendInvitationEmail({ to, firstName, roleNames, inviteUrl, expiresInDays }: InvitationEmail) {
  const env = getServerEnv();
  if (env.EMAIL_PROVIDER !== "resend") {
    throw new Error("The selected email provider is not configured. Set EMAIL_PROVIDER=resend for invitations.");
  }
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const safeFirstName = escapeHtml(firstName);
  const safeInviteUrl = escapeHtml(inviteUrl);
  const safeRoles = roleNames.map(escapeHtml).join(", ");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: "Your SAN TECH Platform invitation",
      text: `Hello ${firstName},\n\nYou have been invited to SAN TECH Platform with the role${roleNames.length === 1 ? "" : "s"}: ${roleNames.join(", ")}.\n\nComplete your account: ${inviteUrl}\n\nThis invitation expires in ${expiresInDays} days.`,
      html: `<div style="margin:0;background:#edf3fa;padding:36px 16px;font-family:Arial,sans-serif;color:#07152d"><div style="margin:0 auto;max-width:560px;background:#fff;border:1px solid #d9e4ef;border-top:4px solid #00a3e0;padding:36px;border-radius:12px"><div style="font-size:12px;font-weight:800;letter-spacing:3px;color:#00a3e0">SAN TECH</div><h1 style="margin:24px 0 12px;font-size:28px;color:#0a1f44">Your platform invitation</h1><p style="font-size:16px;line-height:1.6">Hello ${safeFirstName}, you have been invited to access the SAN TECH Platform.</p><p style="font-size:14px;line-height:1.6;color:#52657e">Assigned role${roleNames.length === 1 ? "" : "s"}: <strong>${safeRoles}</strong></p><p style="margin:28px 0"><a href="${safeInviteUrl}" style="display:inline-block;background:#0a1f44;color:#fff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700">Complete your account</a></p><p style="font-size:13px;line-height:1.6;color:#71839a">This invitation expires in ${expiresInDays} days. If you were not expecting it, you can ignore this email.</p></div></div>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend rejected the invitation email (${response.status}): ${body.slice(0, 300)}`);
  }
}
