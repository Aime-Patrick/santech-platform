"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEnrollmentStatus } from "../api/update-enrollment-status";

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEnrollmentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
