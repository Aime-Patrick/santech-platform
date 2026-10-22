"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { APPLICATION_FILE_MAX_BYTES, APPLICATION_FILE_TYPES } from "@/lib/services/application-service";
import { uploadBufferToCloudinary } from "@/lib/storage/cloudinary";

const applicationSchema = z.object({ type: z.enum(["TRAINING", "FELLOWSHIP", "JOB"]), courseId: z.string().optional(), coverLetter: z.string().trim().min(20).max(5000) });

export async function submitApplication(formData: FormData) {
  const actor = await requirePermission("applications.create");
  const parsed = applicationSchema.safeParse({ type: formData.get("type"), courseId: String(formData.get("courseId") ?? "").trim() || undefined, coverLetter: formData.get("coverLetter") });
  if (!parsed.success) throw new Error("Choose an application type and enter a cover letter of at least 20 characters.");
  if (parsed.data.type === "TRAINING" && !parsed.data.courseId) throw new Error("Choose a training course.");
  if (parsed.data.courseId && !(await prisma.course.findFirst({ where: { id: parsed.data.courseId, status: "PUBLISHED" }, select: { id: true } }))) throw new Error("The selected course is not available.");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length > 5) throw new Error("You can attach up to five files.");
  for (const file of files) { if (!APPLICATION_FILE_TYPES.includes(file.type as (typeof APPLICATION_FILE_TYPES)[number])) throw new Error(`Unsupported file type: ${file.name}`); if (file.size > APPLICATION_FILE_MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB.`); }
  const application = await prisma.application.create({ data: { applicantId: actor.id, type: parsed.data.type, courseId: parsed.data.courseId, coverLetter: parsed.data.coverLetter, status: "SUBMITTED", submittedAt: new Date() } });
  for (const file of files) { const asset = await uploadBufferToCloudinary({ data: Buffer.from(await file.arrayBuffer()), fileName: file.name, mimeType: file.type, folder: "santech-platform/applications" }); await prisma.applicationFile.create({ data: { applicationId: application.id, name: file.name, resourceType: asset.resource_type, mimeType: file.type, bytes: file.size, cloudinaryId: asset.public_id, secureUrl: asset.secure_url } }); }
  await recordAuditLog({ actorId: actor.id, action: "application.created", entityType: "Application", entityId: application.id, metadata: { type: parsed.data.type, courseId: parsed.data.courseId ?? null, fileCount: files.length } });
  revalidatePath("/dashboard/applications");
}

export async function updateApplicationStatus(applicationId: string, formData: FormData) {
  const actor = await requirePermission("applications.review");
  const status = z.enum(["UNDER_REVIEW", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"]).parse(formData.get("status"));
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim().slice(0, 5000) || null;
  const application = await prisma.application.update({ where: { id: applicationId }, data: { status, reviewNotes, reviewedAt: new Date(), reviewedById: actor.id }, select: { id: true, applicantId: true } });
  await recordAuditLog({ actorId: actor.id, action: "application.status.updated", entityType: "Application", entityId: application.id, metadata: { status, applicantId: application.applicantId } });
  revalidatePath("/dashboard/applications");
}
