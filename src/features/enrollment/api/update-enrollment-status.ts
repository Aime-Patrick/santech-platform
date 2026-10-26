export type EnrollmentStatus = "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED" | "WITHDRAWN" | "COMPLETED";

export async function updateEnrollmentStatus(input: { enrollmentId: string; status: EnrollmentStatus }) {
  const response = await fetch(`/api/admin/enrollments/${encodeURIComponent(input.enrollmentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Unable to update enrollment.");
  return body as { enrollment: { id: string; status: EnrollmentStatus; completedAt: string | null }; emailSent: boolean };
}
