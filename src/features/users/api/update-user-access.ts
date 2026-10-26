export async function updateUserAccess(input: { userId: string; status: string; roleIds: string[] }) {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(input.userId)}/access`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: input.status, roleIds: input.roleIds }) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Unable to update user access.");
  return body;
}
