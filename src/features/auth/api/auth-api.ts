export type LoginInput = { email: string; password: string; rememberMe: boolean };
export type RegisterInput = { firstName: string; lastName: string; email: string; password: string; course?: string };
export type AcceptInvitationInput = { token: string; firstName: string; lastName: string; password: string };
export type InvitationDetails = { email: string; firstName: string; lastName: string; roles: string[]; expiresAt: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body as T;
}

export function login(input: LoginInput) { return request<{ user: unknown }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }); }
export function register(input: RegisterInput) { return request<{ user: unknown }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }); }
export function enrollInCourse(course: string) { return request<{ data: unknown }>("/api/courses/enroll", { method: "POST", body: JSON.stringify({ course }) }); }
export function verifyInvitation(token: string) { return request<InvitationDetails>("/api/auth/invitations/verify?token=" + encodeURIComponent(token)); }
export function acceptInvitation(input: AcceptInvitationInput) { return request<{ user: unknown }>("/api/auth/invitations/accept", { method: "POST", body: JSON.stringify(input) }); }
export async function logout() { await fetch("/api/auth/logout", { method: "POST" }); }