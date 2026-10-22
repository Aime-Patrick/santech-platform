"use client";

import { UserRound, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, getStatusVariant } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ManageUserDrawer, type ManageRoleOption, type ManageUserRecord } from "./manage-user-drawer";

interface UsersDataTableProps {
  users: ManageUserRecord[];
  roles: ManageRoleOption[];
  canManage: boolean;
}

export function UsersDataTable({ users, roles, canManage }: UsersDataTableProps) {
  const columns: DataTableColumn<ManageUserRecord>[] = [
    {
      id: "person",
      header: "Person",
      sortable: true,
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 border border-indigo-100 font-bold text-xs text-indigo-600">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (user) => (
        <StatusBadge label={user.status} variant={getStatusVariant(user.status)} />
      ),
    },
    {
      id: "roles",
      header: "Roles",
      cell: (user) => (
        <div className="flex flex-wrap gap-1.5">
          {user.roles
            .filter(({ role }) => role.isActive)
            .map(({ role }) => (
              <span
                key={role.id}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-800"
              >
                <ShieldCheck className="size-3 text-indigo-600" />
                {role.name}
              </span>
            ))}
        </div>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: (user) => {
        const permSet = new Set<string>();
        user.roles
          .filter(({ role }) => role.isActive)
          .forEach(({ role }) =>
            role.permissions.forEach(({ permission }) => permSet.add(permission.name))
          );
        return (
          <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
            {permSet.size} permissions
          </span>
        );
      },
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "Actions",
            align: "right" as const,
            cell: (user: ManageUserRecord) => (
              <ManageUserDrawer
                user={user}
                roles={roles}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Manage
                  </Button>
                }
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(user) => user.id}
      searchKey="firstName"
      searchPlaceholder="Search by name or email..."
      searchFilter={(user, query) => {
        const q = query.toLowerCase();
        return (
          user.firstName.toLowerCase().includes(q) ||
          user.lastName.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q)
        );
      }}
      pagination
      pageSize={10}
      variant="card"
      emptyMessage="No user accounts found."
    />
  );
}
