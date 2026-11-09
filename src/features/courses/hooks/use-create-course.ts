"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourse } from "../api/create-course";
import { courseKeys } from "../query-keys";

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}
