import type { LearnerProgressFilters, LearnerProgressReport } from "../types";

export async function getLearnerProgress(filters: LearnerProgressFilters): Promise<LearnerProgressReport> {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "ALL") params.set("status", filters.status);

  const response = await fetch(`/api/admin/reports/learner-progress?${params.toString()}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Unable to load learner progress.");
  return payload as LearnerProgressReport;
}
