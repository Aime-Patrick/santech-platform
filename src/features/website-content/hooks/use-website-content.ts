import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWebsiteEntry, deleteAsset, deleteWebsiteEntry, getWebsiteEntry, listAssets, listWebsiteEntries, updateAsset, updateWebsiteEntry, uploadAsset } from "../api/website-content-api";
import { websiteContentKeys } from "../queryKeys";
import type { AssetUpdateInput, WebsiteEntryInput, WebsiteEntryUpdateInput } from "../types";

export function useWebsiteEntries(contentType?: string | null) {
  return useQuery({ queryKey: websiteContentKeys.list(contentType), queryFn: () => listWebsiteEntries(contentType), staleTime: 1000 * 60 * 5 });
}
export function useWebsiteEntry(id: string) {
  return useQuery({ queryKey: websiteContentKeys.detail(id), queryFn: () => getWebsiteEntry(id), enabled: Boolean(id) });
}
export function useCreateWebsiteEntry() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: WebsiteEntryInput) => createWebsiteEntry(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: websiteContentKeys.lists() }) });
}
export function useUpdateWebsiteEntry() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: WebsiteEntryUpdateInput) => updateWebsiteEntry(input), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: websiteContentKeys.lists() }); queryClient.invalidateQueries({ queryKey: websiteContentKeys.detail(variables.id) }); } });
}
export function useDeleteWebsiteEntry() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteWebsiteEntry, onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: websiteContentKeys.lists() }); queryClient.removeQueries({ queryKey: websiteContentKeys.detail(id) }); } });
}
export function useAssets(folder?: string, enabled = true) {
  return useQuery({ queryKey: websiteContentKeys.assets(folder), queryFn: () => listAssets(folder), enabled, staleTime: 1000 * 60 * 5 });
}
export function useInfiniteAssets(folder?: string, enabled = true) {
  return useInfiniteQuery({ queryKey: [...websiteContentKeys.assets(folder), "infinite"], queryFn: ({ pageParam }) => listAssets(folder, pageParam, 15), initialPageParam: 1, getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage ?? undefined : undefined, enabled, staleTime: 1000 * 60 * 5 });
}
export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ file, folder }: { file: File; folder?: string }) => uploadAsset(file, folder), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...websiteContentKeys.all, "assets"] }) });
}
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: AssetUpdateInput) => updateAsset(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...websiteContentKeys.all, "assets"] }) });
}
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteAsset(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...websiteContentKeys.all, "assets"] }) });
}