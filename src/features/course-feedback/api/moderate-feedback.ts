export type ModerationInput = {
  kind: "review" | "comment";
  id: string;
  status: "PUBLISHED" | "REJECTED";
};

export async function moderateFeedback(input: ModerationInput): Promise<{ data: unknown }> {
  const response = await fetch("/api/admin/course-feedback", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => ({}))) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Unable to update feedback.");
  return { data: body.data };
}