export const authKeys = {
  all: ["auth"] as const,
  invitation: (token: string) => [...authKeys.all, "invitation", token] as const,
};