"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/services/audit-service";
import { issueCertificateForEnrollment } from "@/lib/services/certificate-service";

export async function issueCertificate(enrollmentId: string) { const actor = await requirePermission("certificates.issue"); const certificate = await issueCertificateForEnrollment(enrollmentId, actor.id); await recordAuditLog({ actorId: actor.id, action: "certificate.issued", entityType: "Certificate", entityId: certificate.id, metadata: { enrollmentId } }); revalidatePath("/dashboard/certificates"); }
export async function revokeCertificate(certificateId: string, formData: FormData) { const actor = await requirePermission("certificates.revoke"); const reason = z.string().trim().max(1000).optional().parse(String(formData.get("reason") ?? "").trim() || undefined); const certificate = await prisma.certificate.update({ where: { id: certificateId }, data: { status: "REVOKED", revokedAt: new Date() }, select: { id: true, certificateNo: true } }); await recordAuditLog({ actorId: actor.id, action: "certificate.revoked", entityType: "Certificate", entityId: certificate.id, metadata: { certificateNo: certificate.certificateNo, reason: reason ?? null } }); revalidatePath("/dashboard/certificates"); }
