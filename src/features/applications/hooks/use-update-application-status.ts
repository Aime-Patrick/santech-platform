import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplicationStatus } from "../api/update-application-status";
import { applicationKeys } from "../queryKeys";

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.reviewList() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.applicationId) });
    },
  });
}
