export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  calendar: (from: string, to: string) => [...appointmentKeys.all, "calendar", { from, to }] as const,
};
