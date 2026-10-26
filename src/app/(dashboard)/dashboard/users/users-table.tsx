import { UserAccessForm } from "@/components/users/user-access-form";
import { Save, ShieldCheck, UserRound } from "lucide-react";
import { updateUserAccess } from "./actions";
import { Button } from "@/components/ui/button";

type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: Array<{ role: { id: string; name: string; key: string; isActive: boolean; permissions: Array<{ permission: { key: string; name: string } }> } }>;
};

type RoleRecord = { id: string; name: string; key: string; isActive: boolean };

export function UsersTable({ users, roles, canManage }: { users: UserRecord[]; roles: RoleRecord[]; canManage: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(10,31,68,0.06)]">
      <div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(160px,1fr)_minmax(190px,1fr)_auto] gap-4 border-b border-slate-200 bg-[#f3f8fc] px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#0a1f44] md:grid">
        <span>Person</span><span>Status</span><span>Roles</span><span>Action</span>
      </div>
      <div className="divide-y divide-slate-100">
        {users.map((user) => (
          <UserAccessForm key={user.id} userId={user.id} status={user.status} roleIds={user.roles.map(({ role }) => role.id)} canManage={canManage}>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7f4fb] text-[#0a1f44]"><UserRound className="size-4" /></span>
              <div className="min-w-0">
                <p className="font-bold text-[#0a1f44]">{user.firstName} {user.lastName}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 md:hidden">Status</span>
              <select name="status" defaultValue={user.status} disabled={!canManage} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-[#0a1f44] outline-none focus:border-[#00a3e0]">
                <option value="ACTIVE">Active</option><option value="INVITED">Invited</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 md:hidden">Roles</span>
              <select name="roleIds" multiple defaultValue={user.roles.map(({ role }) => role.id)} disabled={!canManage} className="min-h-20 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0a1f44] outline-none focus:border-[#00a3e0]">
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </label>
            <div className="text-xs text-slate-500">
              {(() => {
                const permissionMap = new Map<string, string>();
                user.roles.filter(({ role }) => role.isActive).forEach(({ role }) => role.permissions.forEach(({ permission }) => permissionMap.set(permission.key, permission.name)));
                const permissions = [...permissionMap.entries()].sort(([left], [right]) => left.localeCompare(right));
                return (
                  <details className="group rounded-lg border border-slate-200 bg-[#f8fbfd] px-3 py-2">
                    <summary className="cursor-pointer list-none font-semibold text-[#0a1f44] marker:hidden">{permissions.length} effective permission{permissions.length === 1 ? "" : "s"}</summary>
                    <div className="mt-2 grid gap-1 border-t border-slate-200 pt-2">
                      {permissions.length === 0 ? <span className="text-slate-400">No active permissions</span> : permissions.map(([key, name]) => <span key={key} className="text-[11px] text-slate-500"><span className="font-semibold text-[#0a1f44]">{name}</span> · {key}</span>)}
                    </div>
                  </details>
                );
              })()}
            </div>{!canManage ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ShieldCheck className="size-4" />View only</span> : null}</UserAccessForm>
        ))}
      </div>
    </div>
  );
}
