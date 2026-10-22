"use client";

import * as React from "react";
import { ChevronDown, MoreHorizontal, Pencil, Plus, Save } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRole, updateRole } from "./actions";

type PermissionRecord = { id: string; key: string; name: string; group: string };
type RoleRecord = { id: string; key: string; name: string; description: string | null; isSystem: boolean; isActive: boolean; _count: { users: number }; permissions: Array<{ permission: PermissionRecord }> };

function groupedPermissions(permissions: PermissionRecord[]) { return permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => { (groups[permission.group] ??= []).push(permission); return groups; }, {}); }
function roleKey(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48); }

function PermissionGroup({ group, permissions, selected }: { group: string; permissions: PermissionRecord[]; selected: Set<string> }) {
  const [selectedCount, setSelectedCount] = React.useState(() => permissions.filter((permission) => selected.has(permission.id)).length);

  return <details open={group === "Applications"} className="group rounded-xl border border-border/80 bg-muted/20 transition-colors open:bg-background">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
      <span className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{group}</span><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{selectedCount}/{permissions.length}</span></span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
    <div className="grid gap-1 border-t border-border/70 px-4 py-3 sm:grid-cols-2">
      {permissions.map((permission) => <label key={permission.id} className="flex min-w-0 items-start gap-2 rounded-lg px-2 py-2 text-xs transition-colors hover:bg-muted/60"><input type="checkbox" name="permissionIds" value={permission.id} defaultChecked={selected.has(permission.id)} onChange={(event) => setSelectedCount((count) => count + (event.target.checked ? 1 : -1))} className="mt-0.5 size-3.5 shrink-0 accent-primary" /><span className="min-w-0"><span className="block truncate font-medium text-foreground">{permission.name}</span><span className="block truncate text-muted-foreground">{permission.key}</span></span></label>)}
    </div>
  </details>;
}

export function RolesEditor({ roles, permissions, canManage }: { roles: RoleRecord[]; permissions: PermissionRecord[]; canManage: boolean }) {
  const groups = groupedPermissions(permissions);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RoleRecord | null>(null);
  const columns: DataTableColumn<RoleRecord>[] = [
    { id: "name", header: "Role", accessorKey: "name", sortable: true, cell: (role) => <div><div className="flex items-center gap-2"><p className="font-semibold">{role.name}</p>{role.isSystem ? <Badge variant="outline">System</Badge> : null}</div><p className="text-xs text-muted-foreground">{role.key}</p></div> },
    { id: "status", header: "Status", accessorKey: "isActive", sortable: true, cell: (role) => <Badge variant={role.isActive ? "default" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge> },
    { id: "users", header: "Assigned users", cell: (role) => <span className="text-muted-foreground">{role._count.users}</span> },
    { id: "permissions", header: "Permissions", cell: (role) => <span className="text-muted-foreground">{role.permissions.length} granted</span> },
    ...(canManage ? [{ id: "actions", header: "", align: "right" as const, cell: (role: RoleRecord) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${role.name}`}><MoreHorizontal className="size-4" /></Button>} /><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditing(role)}><Pencil className="size-4" /> Edit role</DropdownMenuItem></DropdownMenuContent></DropdownMenu> }] : []),
  ];

  return <div className="space-y-5"><div className="flex justify-end">{canManage ? <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> New role</Button> : null}</div><DataTable data={roles} columns={columns} getRowId={(role) => role.id} searchKey="name" searchPlaceholder="Search roles..." pagination pageSize={10} pageSizeOptions={[10, 20, 50]} showPageSizeSelector variant="card" emptyMessage="No roles found." />{canManage ? <><Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-h-[90vh] !w-[calc(100vw-2rem)] !max-w-none overflow-y-auto p-7 sm:!w-[min(960px,calc(100vw-3rem))] sm:!max-w-none sm:p-8"><DialogHeader><DialogTitle>Create role</DialogTitle><DialogDescription>Define an access group and choose its permissions.</DialogDescription></DialogHeader><RoleForm action={createRole} groups={groups} submitLabel="Create role" /></DialogContent></Dialog><Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="max-h-[90vh] !w-[calc(100vw-2rem)] !max-w-none overflow-y-auto p-7 sm:!w-[min(960px,calc(100vw-3rem))] sm:!max-w-none sm:p-8">{editing ? <><DialogHeader><DialogTitle>Edit {editing.name}</DialogTitle><DialogDescription>Update role details and permissions.</DialogDescription></DialogHeader><RoleForm action={updateRole.bind(null, editing.id)} role={editing} groups={groups} submitLabel="Save changes" /></> : null}</DialogContent></Dialog></> : null}</div>;
}

function RoleForm({ action, role, groups, submitLabel }: { action: (formData: FormData) => void; role?: RoleRecord; groups: Record<string, PermissionRecord[]>; submitLabel: string }) {
  const selected = new Set(role?.permissions.map(({ permission }) => permission.id));
  const [generatedKey, setGeneratedKey] = React.useState(role?.key ?? "");
  const permissionEntries = Object.entries(groups);
  const permissionColumns = [permissionEntries.slice(0, Math.ceil(permissionEntries.length / 2)), permissionEntries.slice(Math.ceil(permissionEntries.length / 2))];
  return <form action={action} className="grid gap-6"><div className="grid gap-5 lg:grid-cols-2"><label className="grid gap-2"><Label htmlFor={role ? `role-name-${role.id}` : "role-name"}>Role name</Label><Input id={role ? `role-name-${role.id}` : "role-name"} name="name" defaultValue={role?.name} onChange={(event) => { if (!role) setGeneratedKey(roleKey(event.target.value)); }} placeholder="Program coordinator" required /></label>{!role ? <input type="hidden" name="key" value={generatedKey} /> : null}</div><label className="grid gap-2"><Label htmlFor={role ? `role-description-${role.id}` : "role-description"}>Description</Label><Textarea id={role ? `role-description-${role.id}` : "role-description"} name="description" defaultValue={role?.description ?? ""} placeholder="What this role can do" /></label>{role ? <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isActive" defaultChecked={role.isActive} disabled={role.key === "administrator"} className="size-4 accent-primary" /> Active role</label> : null}<div><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">Permissions</p><p className="mt-0.5 text-xs text-muted-foreground">Expand a group to choose access.</p></div><span className="text-xs text-muted-foreground">{Object.values(groups).length} groups</span></div><div className="grid gap-2 xl:grid-cols-2 xl:items-start">{permissionColumns.map((column, columnIndex) => <div key={columnIndex} className="grid content-start gap-2">{column.map(([group, groupPermissions]) => <PermissionGroup key={group} group={group} permissions={groupPermissions} selected={selected} />)}</div>)}</div></div><div className="sticky bottom-0 z-10 -mx-7 mt-2 flex justify-end border-t bg-background/95 px-7 py-4 backdrop-blur sm:-mx-8 sm:px-8"><Button type="submit"><Save className="size-4" /> {submitLabel}</Button></div></form>;
}