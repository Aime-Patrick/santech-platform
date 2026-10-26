import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvitation, enrollInCourse, login, logout, register } from "../api/auth-api";
import { authKeys } from "../queryKeys";

export function useLogin() { return useMutation({ mutationFn: login }); }
export function useRegister() { return useMutation({ mutationFn: register }); }
export function useEnrollInCourse() { return useMutation({ mutationFn: enrollInCourse }); }
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: acceptInvitation, onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: authKeys.invitation(variables.token) }) });
}
export function useLogout() { return useMutation({ mutationFn: logout }); }