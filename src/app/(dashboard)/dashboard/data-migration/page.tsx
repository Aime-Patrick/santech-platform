import { requireAdministrator } from "@/lib/authorization/permissions";
import { StrapiMigrationPanel } from "@/components/migrations/strapi-migration-panel";

export const metadata = {
  title: "Strapi data migration | SAN TECH Platform",
  description: "Safely preview and migrate legacy Strapi data into the platform.",
};

export default async function DataMigrationPage() {
  await requireAdministrator();
  return <StrapiMigrationPanel />;
}
