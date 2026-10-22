import type { CatalogOptions } from "./catalog-api";

export type TaxonomyType = "category" | "skill" | "tool";
export type TaxonomyItem = { id: string; name: string; slug: string; description?: string | null; category?: string | null; iconName?: string | null; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; sortOrder?: number };

export async function getTaxonomy(type: TaxonomyType): Promise<{ data: TaxonomyItem[] }> {
  const response = await fetch(`/api/admin/catalog/taxonomy?type=${type}`);
  if (!response.ok) throw new Error("Unable to load taxonomy");
  return response.json() as Promise<{ data: TaxonomyItem[] }>;
}

export async function createTaxonomy(type: TaxonomyType, input: { name: string; slug: string; description?: string; category?: string; iconName?: string }): Promise<{ data: TaxonomyItem }> {
  const response = await fetch(`/api/admin/catalog/taxonomy?type=${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to create taxonomy item");
  return response.json() as Promise<{ data: TaxonomyItem }>;
}

export type { CatalogOptions };

export async function updateTaxonomy(type: TaxonomyType, id: string, input: Partial<{ name: string; slug: string; description: string | null; category: string | null; iconName: string | null; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }>): Promise<{ data: TaxonomyItem }> {
  const response = await fetch(`/api/admin/catalog/taxonomy/${type}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to update taxonomy item");
  return response.json() as Promise<{ data: TaxonomyItem }>;
}

export async function deleteTaxonomy(type: TaxonomyType, id: string): Promise<void> {
  const response = await fetch(`/api/admin/catalog/taxonomy/${type}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to delete taxonomy item");
}