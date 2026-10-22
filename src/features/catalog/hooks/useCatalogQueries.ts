import { useQuery } from "@tanstack/react-query";
import { getCatalogItem, getCatalogItems, getCatalogOptions } from "../api/catalog-api";
import { getTaxonomy, type TaxonomyType } from "../api/taxonomy-api";
import { catalogKeys } from "../queryKeys";

export function useCatalogOptions() {
  return useQuery({ queryKey: [...catalogKeys.all, "options"] as const, queryFn: getCatalogOptions, staleTime: 1000 * 60 * 10 });
}

export function useCatalogItems() {
  return useQuery({ queryKey: catalogKeys.list(), queryFn: getCatalogItems });
}

export function useCatalogItem(slug: string) {
  return useQuery({ queryKey: catalogKeys.detail(slug), queryFn: () => getCatalogItem(slug), enabled: Boolean(slug) });
}

export function useTaxonomy(type: TaxonomyType) {
  return useQuery({ queryKey: catalogKeys.taxonomy(type), queryFn: () => getTaxonomy(type), staleTime: 1000 * 60 * 10 });
}
