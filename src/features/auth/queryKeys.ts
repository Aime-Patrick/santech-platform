export const authKeys = {
  all: ["auth"] as const,
  invitation: (token: string) => [...authKeys.all, "invitation", token] as const,
  passwordReset: (token: string) => [...authKeys.all, "password-reset", token] as const,
};
