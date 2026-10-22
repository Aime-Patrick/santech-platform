import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getComments, getReviews, submitComment, submitReview } from "../api/feedback-api";
import { feedbackKeys } from "../queryKeys";

export function useCourseReviews(courseId: string) { return useQuery({ queryKey: feedbackKeys.reviews(courseId), queryFn: () => getReviews(courseId), staleTime: 1000 * 60 * 5 }); }
export function useCourseComments(courseId: string) { return useQuery({ queryKey: feedbackKeys.comments(courseId), queryFn: () => getComments(courseId), staleTime: 1000 * 60 * 5 }); }
export function useSubmitReview() { const queryClient = useQueryClient(); return useMutation({ mutationFn: submitReview, onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: feedbackKeys.reviews(variables.courseId) }) }); }
export function useSubmitComment() { const queryClient = useQueryClient(); return useMutation({ mutationFn: submitComment, onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: feedbackKeys.comments(variables.courseId) }) }); }
