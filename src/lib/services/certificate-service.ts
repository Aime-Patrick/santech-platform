import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { uploadBufferToCloudinary } from "@/lib/storage/cloudinary";

function escapeXml(value: string) { return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character); }
function certificateNumber() { return `SAN-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`; }
function certificateSvg({ learnerName, courseTitle, number, issuedAt }: { learnerName: string; courseTitle: string; number: string; issuedAt: string }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#f7fbff"/><rect x="38" y="38" width="1524" height="924" rx="18" fill="none" stroke="#00a3e0" stroke-width="8"/><rect x="78" y="78" width="1444" height="844" rx="12" fill="none" stroke="#0a1f44" stroke-width="3"/><text x="800" y="190" text-anchor="middle" fill="#00a3e0" font-family="Arial,sans-serif" font-size="34" font-weight="700" letter-spacing="12">SAN TECH / SAN HUB</text><text x="800" y="340" text-anchor="middle" fill="#0a1f44" font-family="Arial,sans-serif" font-size="78" font-weight="700">CERTIFICATE OF COMPLETION</text><text x="800" y="445" text-anchor="middle" fill="#526681" font-family="Arial,sans-serif" font-size="30">This certificate is presented to</text><text x="800" y="555" text-anchor="middle" fill="#0a1f44" font-family="Arial,sans-serif" font-size="64" font-weight="700">${escapeXml(learnerName)}</text><text x="800" y="650" text-anchor="middle" fill="#526681" font-family="Arial,sans-serif" font-size="30">for successfully completing</text><text x="800" y="720" text-anchor="middle" fill="#0a1f44" font-family="Arial,sans-serif" font-size="44" font-weight="700">${escapeXml(courseTitle)}</text><text x="800" y="825" text-anchor="middle" fill="#526681" font-family="Arial,sans-serif" font-size="24">Issued ${escapeXml(issuedAt)}  •  ${escapeXml(number)}</text></svg>`;
}

export async function issueCertificateForEnrollment(enrollmentId: string, issuedById?: string | null) {
  const existing = await prisma.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { learner: true, course: true } });
  if (!enrollment || enrollment.status !== "COMPLETED") throw new Error("CERTIFICATE_REQUIRES_COMPLETED_ENROLLMENT");
  const number = certificateNumber();
  const issuedAt = new Date();
  let cloudinaryId: string | undefined;
  let secureUrl: string | undefined;
  try {
    const asset = await uploadBufferToCloudinary({ data: Buffer.from(certificateSvg({ learnerName: `${enrollment.learner.firstName} ${enrollment.learner.lastName}`, courseTitle: enrollment.course.title, number, issuedAt: issuedAt.toLocaleDateString("en-RW") })), fileName: `${number}.svg`, mimeType: "image/svg+xml", folder: "santech-platform/certificates" });
    cloudinaryId = asset.public_id;
    secureUrl = asset.secure_url;
  } catch (error) {
    if (error instanceof Error && error.message !== "CLOUDINARY_NOT_CONFIGURED") console.error("Certificate asset upload failed", error);
  }
  try {
    return await prisma.certificate.create({ data: { certificateNo: number, learnerId: enrollment.learnerId, courseId: enrollment.courseId, enrollmentId, issuedById, cloudinaryId, secureUrl, issuedAt } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return prisma.certificate.findUniqueOrThrow({ where: { enrollmentId } });
    throw error;
  }
}

export function listCertificates(learnerId?: string) { return prisma.certificate.findMany({ where: learnerId ? { learnerId } : undefined, orderBy: { issuedAt: "desc" }, include: { learner: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true } } } }); }
export function listEligibleEnrollmentsForCertificate() { return prisma.enrollment.findMany({ where: { status: "COMPLETED", certificate: null }, orderBy: { completedAt: "desc" }, include: { learner: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true } } } }); }
export function getCertificateByVerificationId(verificationId: string) { return prisma.certificate.findUnique({ where: { verificationId }, include: { learner: { select: { firstName: true, lastName: true } }, course: { select: { title: true, slug: true } } } }); }
