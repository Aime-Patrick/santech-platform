import { getServerEnv } from "@/lib/env";

type LearnerWelcomeEmail = { to: string; firstName: string };
type EnrollmentEmail = { to: string; firstName: string; courseTitle: string; enrollmentStatus: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

async function sendEmail(input: { to: string; subject: string; text: string; html: string }) {
  const env = getServerEnv();
  if (env.EMAIL_PROVIDER !== "resend" || !env.RESEND_API_KEY) {
    console.warn("Email not sent: configure EMAIL_PROVIDER=resend and RESEND_API_KEY.");
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [input.to], subject: input.subject, text: input.text, html: input.html }) });
    if (!response.ok) { console.error("Email provider rejected message", response.status); return false; }
    return true;
  } catch (error) {
    console.error("Email delivery failed", error);
    return false;
  }
}

export async function sendLearnerWelcomeEmail({ to, firstName }: LearnerWelcomeEmail) {
  const env = getServerEnv();
  const loginUrl = `${env.APP_URL.replace(/\/$/, "")}/login`;
  const safeName = escapeHtml(firstName);
  return sendEmail({
    to,
    subject: "Welcome to SAN TECH Platform",
    text: `Hello ${firstName},\n\nYour SAN TECH learner account is ready. Sign in here: ${loginUrl}\n\nUse the password you created during registration. For security, we never send passwords by email.`,
    html: `<div style="font-family:Arial,sans-serif;color:#07152d;max-width:560px;margin:auto;padding:32px"><div style="font-size:12px;font-weight:800;letter-spacing:3px;color:#4a45ff">SAN TECH</div><h1>Welcome, ${safeName}</h1><p>Your learner account is ready. Use the password you created during registration.</p><p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#4a45ff;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open your platform</a></p><p style="color:#64748b;font-size:13px">For your security, we never send passwords by email.</p></div>`,
  });
}

export async function sendEnrollmentConfirmationEmail({ to, firstName, courseTitle, enrollmentStatus }: EnrollmentEmail) {
  const env = getServerEnv();
  const loginUrl = `${env.APP_URL.replace(/\/$/, "")}/login`;
  const safeName = escapeHtml(firstName);
  const safeCourse = escapeHtml(courseTitle);
  const safeStatus = escapeHtml(enrollmentStatus.toLowerCase());
  return sendEmail({
    to,
    subject: `SAN TECH enrollment update: ${courseTitle}`,
    text: `Hello ${firstName},\n\nYour enrollment request for ${courseTitle} is ${enrollmentStatus.toLowerCase()}. Sign in to view your course: ${loginUrl}`,
    html: `<div style="font-family:Arial,sans-serif;color:#07152d;max-width:560px;margin:auto;padding:32px"><div style="font-size:12px;font-weight:800;letter-spacing:3px;color:#4a45ff">SAN TECH</div><h1>Enrollment update</h1><p>Hello ${safeName}, your request for <strong>${safeCourse}</strong> is <strong>${safeStatus}</strong>.</p><p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#4a45ff;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open your learner account</a></p></div>`,
  });
}

