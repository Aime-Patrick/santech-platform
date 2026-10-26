import type { Asset, AssetUpdateInput, WebsiteEntry, WebsiteEntryInput, WebsiteEntryUpdateInput } from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await response.json().catch(() => ({}))) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? "The website content request failed.");
  return body as T;
}

export async function listWebsiteEntries(contentType?: string | null) {
  const query = contentType ? "?contentType=" + encodeURIComponent(contentType) : "";
  return request<{ data: WebsiteEntry[] }>("/api/admin/website-content" + query);
}
export async function getWebsiteEntry(id: string) {
  return request<{ data: WebsiteEntry[] }>("/api/admin/website-content?id=" + encodeURIComponent(id));
}
export async function createWebsiteEntry(input: WebsiteEntryInput) {
  return request<{ data: WebsiteEntry }>("/api/admin/website-content", { method: "POST", body: JSON.stringify(input) });
}
export async function updateWebsiteEntry(input: WebsiteEntryUpdateInput) {
  return request<{ data: WebsiteEntry }>("/api/admin/website-content", { method: "PATCH", body: JSON.stringify(input) });
}
export async function deleteWebsiteEntry(id: string) {
  return request<{ ok: true }>("/api/admin/website-content?id=" + encodeURIComponent(id), { method: "DELETE" });
}
export type AssetPage = { data: Asset[]; page: number; pageSize: number; hasMore: boolean; nextPage: number | null };
export async function listAssets(folder?: string, page = 1, pageSize = 15) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (folder) params.set("folder", folder);
  return request<AssetPage>("/api/admin/assets?" + params.toString());
}
export async function uploadAsset(file: File, folder?: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder || "santech-platform/website-content");
  const response = await fetch("/api/admin/assets", { method: "POST", body: form });
  const body = (await response.json().catch(() => ({}))) as { data?: Asset; error?: string };
  if (!response.ok) throw new Error(body.error ?? "The asset upload failed.");
  return body;
}
export async function updateAsset(input: AssetUpdateInput) {
  return request<{ data: Asset }>("/api/admin/assets", { method: "PATCH", body: JSON.stringify(input) });
}
export async function deleteAsset(id: string) {
  return request<{ ok: true }>("/api/admin/assets?id=" + encodeURIComponent(id), { method: "DELETE" });
}