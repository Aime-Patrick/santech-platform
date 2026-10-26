export type SendInvitationInput = {
  email: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
};

export async function sendInvitation(input: SendInvitationInput): Promise<{ data: unknown }> {
  const response = await fetch("/api/admin/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => ({}))) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? "The invitation could not be sent.");
  return { data: body.data };
}