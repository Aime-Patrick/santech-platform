import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveCatalogItem, createCatalogItem, updateCatalogItem } from "../api/catalog-api";
import { createTaxonomy, deleteTaxonomy, type TaxonomyType, updateTaxonomy } from "../api/taxonomy-api";
import { catalogKeys } from "../queryKeys";
import type { CatalogItemInput } from "../types";

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CatalogItemInput) => createCatalogItem(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.lists() }) });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CatalogItemInput & { id: string }) => updateCatalogItem(input), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: catalogKeys.lists() }); queryClient.invalidateQueries({ queryKey: catalogKeys.detail(variables.slug) }); } });
}

export function useArchiveCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: archiveCatalogItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.lists() }) });
}

export function useCreateTaxonomy() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ type, input }: { type: TaxonomyType; input: { name: string; slug: string; description?: string; category?: string; iconName?: string } }) => createTaxonomy(type, input), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: catalogKeys.taxonomy(variables.type) }); queryClient.invalidateQueries({ queryKey: [...catalogKeys.all, "options"] }); } });
}

export function useUpdateTaxonomy() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ type, id, input }: { type: TaxonomyType; id: string; input: Parameters<typeof updateTaxonomy>[2] }) => updateTaxonomy(type, id, input), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: catalogKeys.taxonomy(variables.type) }); queryClient.invalidateQueries({ queryKey: [...catalogKeys.all, "options"] }); } });
}

export function useDeleteTaxonomy() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ type, id }: { type: TaxonomyType; id: string }) => deleteTaxonomy(type, id), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: catalogKeys.taxonomy(variables.type) }); queryClient.invalidateQueries({ queryKey: [...catalogKeys.all, "options"] }); } });
}