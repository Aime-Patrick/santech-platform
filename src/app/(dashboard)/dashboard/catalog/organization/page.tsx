import { requirePermission } from "@/lib/authorization/permissions";
import { CatalogOrganization } from "@/components/catalog/catalog-organization";

export default async function CatalogOrganizationPage() {
  await requirePermission("courses.view");
  return <CatalogOrganization />;
}