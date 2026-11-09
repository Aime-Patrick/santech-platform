export type CreateCourseResponse = {
  data: { id: string; title: string; slug: string };
};

export async function createCourse(formData: FormData): Promise<CreateCourseResponse> {
  const response = await fetch("/api/admin/courses", { method: "POST", body: formData });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to create course.");
  }

  return payload as CreateCourseResponse;
}
