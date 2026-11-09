import { useQuery } from "@tanstack/react-query";
import { verifyPasswordReset } from "../api/auth-api";
import { authKeys } from "../queryKeys";

export function usePasswordResetToken(token: string) {
  return useQuery({
    queryKey: authKeys.passwordReset(token),
    queryFn: () => verifyPasswordReset(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  });
}
