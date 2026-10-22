import { UsersRound, UserCheck, UserPlus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authorization/permissions";
import { listAdminRoles, listAdminUsers } from "@/lib/services/admin-service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { UsersDataTable } from "@/components/users/users-data-table";
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog";

export default async function UsersPage() {
  const actor = await requirePermission("users.view");
  const [users, roles] = await Promise.all([listAdminUsers(), listAdminRoles()]);
  const canManage = hasPermission(actor, "users.manage");

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const invitedCount = users.filter((u) => u.status === "INVITED").length;
  const activePercent = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage account status and access assignments from one operational view."
        actions={canManage ? <InviteUserDialog roles={roles.filter((r) => r.isActive)} /> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total accounts"
          value={users.length}
          icon={<UsersRound className="size-4" />}
          badge="Platform"
        />
        <StatCard
          label="Active accounts"
          value={activeCount}
          icon={<UserCheck className="size-4" />}
          badge={`${activePercent}% active`}
        />
        <StatCard
          label="Pending invitations"
          value={invitedCount}
          icon={<UserPlus className="size-4" />}
          badge={invitedCount === 0 ? "All claimed" : `${invitedCount} pending`}
        />
      </div>

      {!canManage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. An administrator can change status and role assignments.
        </p>
      ) : null}

      <UsersDataTable
        users={users}
        roles={roles.filter((r) => r.isActive)}
        canManage={canManage}
      />
    </section>
  );
}
