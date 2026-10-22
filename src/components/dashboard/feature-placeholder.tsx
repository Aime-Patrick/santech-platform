import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export async function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  permission,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  permission: string | string[];
  icon?: LucideIcon;
}) {
  const user = await getCurrentUser();
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  if (!user || !requiredPermissions.some((requiredPermission) => hasPermission(user, requiredPermission))) {
    return (
      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 size-5 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Access boundary</p>
            <h2 className="mt-1 text-lg font-bold text-[#0a1f44]">You do not have access to this workspace.</h2>
            <p className="mt-1 text-sm text-amber-900/75">Ask an administrator to assign the required permission.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a3e0]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#0a1f44]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        eyebrow="Coming next"
        title="This workspace is ready for its first records."
        description="The shared platform foundation is in place. This module will use the same tables, permissions, empty states, and review patterns as the rest of SAN TECH Platform."
      />
    </section>
  );
}
