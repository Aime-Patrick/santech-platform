import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { sendEnrollmentConfirmationEmail } from "@/lib/email/learner-email";
import { requestCourseEnrollment } from "@/lib/services/enrollment-service";

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sign in to continue with enrollment." }, { status: 401 });
  if (!hasPermission(actor, "enrollments.apply")) return NextResponse.json({ code: "FORBIDDEN", message: "Your account cannot request enrollment." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { course?: unknown };
  const courseRef = typeof body.course === "string" ? body.course.trim() : "";
  if (!courseRef) return NextResponse.json({ code: "COURSE_REQUIRED", message: "Choose a course before continuing." }, { status: 400 });
  const result = await requestCourseEnrollment({ learnerId: actor.id, courseRef });
  const loginUrl = `${process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3002"}/login`;
  if (result.kind === "unavailable") return NextResponse.json({ code: "COURSE_UNAVAILABLE", message: "This course is not currently open for enrollment." }, { status: 404 });
  if (result.kind === "existing") return NextResponse.json({ code: "ALREADY_ENROLLED", message: `You already have an enrollment for ${result.course.title}. Open your learner account to continue.`, enrollment: result.enrollment, loginUrl }, { status: 409 });
  const emailSent = await sendEnrollmentConfirmationEmail({ to: actor.email, firstName: actor.firstName, courseTitle: result.course.title, enrollmentStatus: result.enrollment.status });
  return NextResponse.json({ message: `Your enrollment request for ${result.course.title} has been received.`, enrollment: result.enrollment, emailSent, loginUrl }, { status: 201 });
}