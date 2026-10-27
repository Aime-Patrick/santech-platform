import { requirePermission } from "@/lib/authorization/permissions";
import { listAuditLogs } from "@/lib/services/admin-service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type AuditLogRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  actor: { firstName: string; lastName: string } | null;
};
export default async function AuditLogsPage() {
  await requirePermission("audit_logs.view");
  const logs = await listAuditLogs();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Review sensitive access and administration changes made across the platform."
      />

      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No administrative activity has been recorded yet.
            </p>
          ) : (
            logs.map((log: AuditLogRecord) => (
              <div
                key={log.id}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs font-bold text-[#0a1f44]">{log.action}</p>
                  <p className="text-[10px] text-slate-400">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {log.actor
                    ? `${log.actor.firstName} ${log.actor.lastName}`
                    : "System"}
                </p>
                <time
                  className="text-xs text-slate-400"
                  dateTime={log.createdAt.toISOString()}
                >
                  {log.createdAt.toLocaleString()}
                </time>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
