import { requirePermission } from "@/lib/authorization/permissions";
import { CatalogDashboard } from "@/components/catalog/catalog-dashboard";

export default async function CatalogPage() {
  await requirePermission("courses.view");
  return <CatalogDashboard />;
}
