import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { applicationDecisionStatuses } from "@/features/applications/types";

type RouteContext = { params: Promise<{ id: string }> };

const updateStatusSchema = z.object({
  status: z.enum(applicationDecisionStatuses),
  reviewNotes: z.string().trim().max(5000).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "applications.review")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid application decision." }, { status: 400 });
  }

  const { id } = await context.params;
  const reviewNotes = parsed.data.reviewNotes || null;

  try {
    const application = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.data.status,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedById: actor.id,
      },
      select: { id: true, applicantId: true, status: true, reviewNotes: true, reviewedAt: true },
    });

    await recordAuditLog({
      actorId: actor.id,
      action: "application.status.updated",
      entityType: "Application",
      entityId: application.id,
      metadata: { status: application.status, applicantId: application.applicantId },
    });

    return NextResponse.json({
      data: {
        id: application.id,
        status: application.status,
        reviewNotes: application.reviewNotes,
        reviewedAt: application.reviewedAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    throw error;
  }
}
