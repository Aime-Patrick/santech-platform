export const websiteContentKeys = {
  all: ["website-content"] as const,
  lists: () => [...websiteContentKeys.all, "list"] as const,
  list: (contentType?: string | null) => [...websiteContentKeys.lists(), contentType ?? "all"] as const,
  details: () => [...websiteContentKeys.all, "detail"] as const,
  detail: (id: string) => [...websiteContentKeys.details(), id] as const,
  assets: (folder?: string) => [...websiteContentKeys.all, "assets", folder ?? "all"] as const,
};