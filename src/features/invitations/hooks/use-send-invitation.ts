import { useMutation } from "@tanstack/react-query";
import { sendInvitation } from "../api/send-invitation";

export function useSendInvitation() {
  return useMutation({ mutationFn: sendInvitation });
}