import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderateFeedback, type ModerationInput } from "../api/moderate-feedback";
import { feedbackKeys } from "../queryKeys";

export function useModerateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ModerationInput) => moderateFeedback(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedbackKeys.all }),
  });
}