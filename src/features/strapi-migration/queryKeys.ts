export const strapiMigrationKeys = {
  all: ["strapi-migration"] as const,
  job: (id: string) => [...strapiMigrationKeys.all, "job", id] as const,
};
