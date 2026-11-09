import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvitation, completePasswordReset, enrollInCourse, login, logout, register, requestPasswordReset } from "../api/auth-api";
import { authKeys } from "../queryKeys";

export function useLogin() { return useMutation({ mutationFn: login }); }
export function useRegister() { return useMutation({ mutationFn: register }); }
export function useRequestPasswordReset() { return useMutation({ mutationFn: requestPasswordReset }); }
export function useCompletePasswordReset() { return useMutation({ mutationFn: completePasswordReset }); }
export function useEnrollInCourse() { return useMutation({ mutationFn: enrollInCourse }); }
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: acceptInvitation, onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: authKeys.invitation(variables.token) }) });
}
export function useLogout() { return useMutation({ mutationFn: logout }); }
