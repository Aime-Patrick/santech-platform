"use client";

import { useState } from "react";
import { Mail, UserPlus, X, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendInvitation } from "@/features/invitations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type RoleOption = { id: string; name: string; key: string };

export function InviteUserDialog({ roles }: { roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);

  const [success, setSuccess] = useState("");
  const sendInvitationMutation = useSendInvitation();

  function resetForm() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRoleIds([]);
    sendInvitationMutation.reset();
    setSuccess("");
  }

  function handleOpenChange(newOpen: boolean) {
    if (sendInvitationMutation.isPending) return;
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  }

  function toggleRole(roleId: string) {
    setRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    sendInvitationMutation.mutate({ email, firstName, lastName, roleIds }, {
      onSuccess: () => {
        setSuccess("Invitation sent! The user will receive an onboarding link.");
        window.setTimeout(() => { setOpen(false); resetForm(); }, 1200);
      },
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="right">
      <DrawerTrigger
        render={
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold">
            <UserPlus className="size-4" />
            Invite user
          </Button>
        }
      />
      <DrawerContent className="data-[swipe-axis=x]:sm:[--drawer-content-width:32rem] bg-white border-l border-slate-200">
        <DrawerHeader className="border-b border-slate-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Administration / People
              </p>
              <DrawerTitle className="text-xl font-bold text-slate-900 mt-0.5">
                Invite New User
              </DrawerTitle>
              <DrawerDescription className="text-xs text-slate-500 mt-1">
                Create an account profile and dispatch a secure onboarding link by email.
              </DrawerDescription>
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

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {sendInvitationMutation.error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {sendInvitationMutation.error.message}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                {success}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="invite-first-name" className="text-xs font-semibold text-slate-700">
                  First name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="invite-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="e.g. Kai"
                  required
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-last-name" className="text-xs font-semibold text-slate-700">
                  Last name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="invite-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="e.g. Doe"
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold text-slate-700">
                Email address <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  required
                  className="h-10 pr-9 text-sm"
                />
                <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Assigned Roles <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {roleIds.length} selected
                </span>
              </div>
              <div className="space-y-2">
                {roles.map((role) => {
                  const selected = roleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        selected
                          ? "border-indigo-600 bg-indigo-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRole(role.id)}
                        className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <ShieldCheck className="size-3.5 text-indigo-500" />
                          {role.name}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          {role.key}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-slate-100 p-6 flex flex-row items-center justify-end gap-3">
            <DrawerClose
              render={
                <Button type="button" variant="outline" size="sm" disabled={sendInvitationMutation.isPending}>
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              size="sm"
              disabled={sendInvitationMutation.isPending || roleIds.length === 0}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-28 font-semibold"
            >
              {sendInvitationMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send invitation"
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
