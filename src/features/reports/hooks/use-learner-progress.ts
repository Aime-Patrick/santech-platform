import { useQuery } from "@tanstack/react-query";
import { getLearnerProgress } from "../api/get-learner-progress";
import { reportKeys } from "../query-keys";
import type { LearnerProgressFilters } from "../types";

export function useLearnerProgress(filters: LearnerProgressFilters) {
  return useQuery({
    queryKey: reportKeys.learnerProgress(filters),
    queryFn: () => getLearnerProgress(filters),
    placeholderData: (previousData) => previousData,
  });
}
