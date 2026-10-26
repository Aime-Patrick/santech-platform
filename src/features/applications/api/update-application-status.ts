import type { UpdateApplicationStatusInput, UpdateApplicationStatusResponse } from "../types";

export async function updateApplicationStatus({
  applicationId,
  status,
  reviewNotes,
}: UpdateApplicationStatusInput): Promise<UpdateApplicationStatusResponse> {
  const response = await fetch(`/api/admin/applications/${encodeURIComponent(applicationId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewNotes }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    const error = new Error(body?.error ?? "The decision could not be saved.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<UpdateApplicationStatusResponse>;
}
