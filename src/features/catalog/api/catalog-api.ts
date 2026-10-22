import type { CatalogItem, CatalogItemInput, CatalogListResponse, CatalogDetailResponse } from "../types";

export type CatalogOptions = { categories: Array<{ id: string; name: string; slug: string }>; skills: Array<{ id: string; name: string; slug: string }>; tools: Array<{ id: string; name: string; slug: string }> };

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const error = new Error((await response.json().catch(() => null))?.error ?? "Request failed") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function getCatalogOptions(): Promise<CatalogOptions> {
  return request<CatalogOptions>("/api/admin/catalog/options");
}

export async function getCatalogItems(): Promise<CatalogListResponse> {
  return request<CatalogListResponse>("/api/admin/catalog");
}

export async function getCatalogItem(slug: string): Promise<CatalogDetailResponse> {
  return request<CatalogDetailResponse>(`/api/public/catalog/${encodeURIComponent(slug)}`);
}

export async function createCatalogItem(input: CatalogItemInput): Promise<{ data: CatalogItem }> {
  return request<{ data: CatalogItem }>("/api/admin/catalog", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCatalogItem({ id, ...input }: CatalogItemInput & { id: string }): Promise<{ data: CatalogItem }> {
  return request<{ data: CatalogItem }>(`/api/admin/catalog/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function archiveCatalogItem(id: string): Promise<{ ok: true; archived: true }> {
  return request<{ ok: true; archived: true }>(`/api/admin/catalog/${encodeURIComponent(id)}`, { method: "DELETE" });
}
