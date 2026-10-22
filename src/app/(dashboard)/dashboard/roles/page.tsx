import { requirePermission, hasPermission } from "@/lib/authorization/permissions";
import { listAdminRoles, listPermissions } from "@/lib/services/admin-service";
import { PageHeader } from "@/components/shared/page-header";
import { RolesEditor } from "./roles-editor";

export default async function RolesPage() {
  const actor = await requirePermission("roles.view");
  const [roles, permissions] = await Promise.all([listAdminRoles(), listPermissions()]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Create reusable access groups and assign granular permissions without duplicating dashboards."
      />
      <RolesEditor
        roles={roles}
        permissions={permissions}
        canManage={hasPermission(actor, "roles.manage")}
      />
    </section>
  );
}
