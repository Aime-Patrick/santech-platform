export const catalogKeys = {
  all: ["catalog"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: () => [...catalogKeys.lists()] as const,
  details: () => [...catalogKeys.all, "detail"] as const,
  detail: (slug: string) => [...catalogKeys.details(), slug] as const,
  taxonomy: (type: string) => [...catalogKeys.all, "taxonomy", type] as const,
};
