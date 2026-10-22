import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendLearnerWelcomeEmail } from "@/lib/email/learner-email";

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter your name, a valid email, and a password of at least 8 characters." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists. Please log in instead." }, { status: 409 });

  const learnerRole = await prisma.role.findUnique({ where: { key: "learner" }, select: { id: true } });
  if (!learnerRole) return NextResponse.json({ error: "Learner registration is not configured yet." }, { status: 503 });

  const user = await prisma.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      passwordHash: await hashPassword(parsed.data.password),
      status: "ACTIVE",
      roles: { create: { roleId: learnerRole.id } },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  await createSession(user.id, parsed.data.rememberMe);
  const emailSent = await sendLearnerWelcomeEmail({ to: user.email, firstName: user.firstName });
  return NextResponse.json({ user, emailSent }, { status: 201 });
}



