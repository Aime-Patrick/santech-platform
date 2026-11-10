import type { LearnerProgressFilters } from "./types";

export const reportKeys = {
  all: ["reports"] as const,
  learnerProgress: (filters: LearnerProgressFilters) => [...reportKeys.all, "learner-progress", filters] as const,
};
