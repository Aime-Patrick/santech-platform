import { getServerEnv } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character] ?? character);
}

export async function sendPasswordResetEmail(input: { to: string; firstName: string; resetUrl: string }) {
  const env = getServerEnv();
  if (env.EMAIL_PROVIDER !== "resend" || !env.RESEND_API_KEY) {
    throw new Error("Password reset email delivery is not configured.");
  }

  const name = escapeHtml(input.firstName || "there");
  const url = escapeHtml(input.resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: "Reset your SAN TECH Platform password",
      text: `Hello ${input.firstName || "there"},\n\nUse this link to reset your SAN TECH Platform password. It expires in 30 minutes and can only be used once:\n${input.resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
      html: `<div style="margin:0;background:#edf3fa;padding:36px 16px;font-family:Arial,sans-serif;color:#07152d"><div style="margin:0 auto;max-width:560px;background:#fff;border:1px solid #d9e4ef;border-top:4px solid #00a3e0;padding:36px;border-radius:12px"><div style="font-size:12px;font-weight:800;letter-spacing:3px;color:#00a3e0">SAN TECH</div><h1 style="margin:24px 0 12px;font-size:28px;color:#0a1f44">Reset your password</h1><p style="font-size:16px;line-height:1.6">Hello ${name}, use the button below to choose a new password for your account.</p><p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#0a1f44;color:#fff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700">Reset password</a></p><p style="font-size:13px;line-height:1.6;color:#71839a">This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p></div></div>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend rejected the password reset email (${response.status}): ${details.slice(0, 300)}`);
  }
}
