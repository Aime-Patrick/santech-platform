import { useQuery } from "@tanstack/react-query";
import { verifyInvitation } from "../api/auth-api";
import { authKeys } from "../queryKeys";

export function useInvitation(token: string) {
  return useQuery({ queryKey: authKeys.invitation(token), queryFn: () => verifyInvitation(token), enabled: Boolean(token), retry: false });
}