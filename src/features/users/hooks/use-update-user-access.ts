"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserAccess } from "../api/update-user-access";
export function useUpdateUserAccess() { const queryClient = useQueryClient(); return useMutation({ mutationFn: updateUserAccess, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); } }); }
