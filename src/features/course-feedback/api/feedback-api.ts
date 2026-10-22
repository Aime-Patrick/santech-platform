export type CourseFeedback = { id: string; rating?: number; title?: string | null; body: string; status?: string; createdAt: string; learner?: { firstName: string; lastName: string } };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || "Something went wrong.");
  return body as T;
}

export function getReviews(courseId: string) { return request<{ data: CourseFeedback[]; summary: { count: number; average: number } }>(`/api/courses/${courseId}/reviews`); }
export function getComments(courseId: string) { return request<{ data: CourseFeedback[] }>(`/api/courses/${courseId}/comments`); }
export function submitReview(input: { courseId: string; rating: number; title?: string; body: string }) { return request<{ data: CourseFeedback; message: string }>(`/api/courses/${input.courseId}/reviews`, { method: "POST", body: JSON.stringify({ rating: input.rating, title: input.title, body: input.body }) }); }
export function submitComment(input: { courseId: string; body: string }) { return request<{ data: CourseFeedback; message: string }>(`/api/courses/${input.courseId}/comments`, { method: "POST", body: JSON.stringify({ body: input.body }) }); }
