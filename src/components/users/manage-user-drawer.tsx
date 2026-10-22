"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  UserRound,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge, getStatusVariant } from "@/components/shared/status-badge";
import { updateUserAccess } from "@/app/(dashboard)/dashboard/users/actions";

export type ManageUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: Array<{
    role: {
      id: string;
      name: string;
      key: string;
      isActive: boolean;
      permissions: Array<{ permission: { key: string; name: string } }>;
    };
  }>;
};

export type ManageRoleOption = {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  permissions?: Array<{ permission: { key: string; name: string } }>;
};

interface ManageUserDrawerProps {
  user: ManageUserRecord;
  roles: ManageRoleOption[];
  trigger?: React.ReactNode;
}

const STATUS_OPTIONS: Array<{
  value: "ACTIVE" | "INVITED" | "SUSPENDED" | "ARCHIVED";
  label: string;
  description: string;
  colorClass: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
    description: "Account has full active access according to assigned roles.",
    colorClass: "border-emerald-500 bg-emerald-50 text-emerald-800",
  },
  {
    value: "INVITED",
    label: "Invited",
    description: "Invitation sent, waiting for user to finish registration.",
    colorClass: "border-amber-500 bg-amber-50 text-amber-800",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
    description: "Temporary block. User cannot sign in or access resources.",
    colorClass: "border-rose-500 bg-rose-50 text-rose-800",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    description: "Decommissioned account retained only for audit history.",
    colorClass: "border-slate-400 bg-slate-100 text-slate-800",
  },
];

export function ManageUserDrawer({ user, roles, trigger }: ManageUserDrawerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(user.status);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    user.roles.map((r) => r.role.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset local state when opened
  React.useEffect(() => {
    if (open) {
      setStatus(user.status);
      setSelectedRoleIds(user.roles.map((r) => r.role.id));
      setError(null);
      setSuccess(false);
    }
  }, [open, user]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("status", status);
    selectedRoleIds.forEach((id) => formData.append("roleIds", id));

    startTransition(async () => {
      try {
        await updateUserAccess(user.id, formData);
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
        }, 600);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update user access.");
      }
    });
  };

  // Compute effective permissions for preview
  const effectivePermissions = React.useMemo(() => {
    const set = new Set<string>();
    roles
      .filter((r) => selectedRoleIds.includes(r.id))
      .forEach((r) => {
        r.permissions?.forEach((p) => set.add(p.permission.name));
      });
    return Array.from(set).sort();
  }, [roles, selectedRoleIds]);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <SlidersHorizontal className="size-3.5" />
              Manage
            </Button>
          )
        }
      />
      <DrawerContent className="data-[swipe-axis=x]:sm:[--drawer-content-width:32rem] bg-white border-l border-slate-200">
        <DrawerHeader className="border-b border-slate-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 text-sm">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div>
                <DrawerTitle className="text-lg font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-500">
                  {user.email}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-slate-400 hover:text-slate-700"
                />
              }
            >
              <X className="size-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span>User access updated successfully!</span>
            </div>
          )}

          {/* Account Status Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Status
              </label>
              <StatusBadge label={status} variant={getStatusVariant(status)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      {isSelected && <Check className="size-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Assignments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Role Assignments
              </label>
              <span className="text-xs font-medium text-slate-500">
                {selectedRoleIds.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const isChecked = selectedRoleIds.includes(role.id);
                const permCount = role.permissions?.length || 0;
                return (
                  <label
                    key={role.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "border-indigo-600 bg-indigo-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRole(role.id)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5 text-indigo-500" />
                          {role.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {permCount} perms
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {role.key}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Effective Permissions Preview */}
          {effectivePermissions.length > 0 && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Granted Capabilities ({effectivePermissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                {effectivePermissions.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-slate-100 p-6 flex flex-row items-center justify-end gap-3">
          <DrawerClose
            render={
              <Button variant="outline" size="sm" disabled={isPending}>
                Cancel
              </Button>
            }
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-28"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
