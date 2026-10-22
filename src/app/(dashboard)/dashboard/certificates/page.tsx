import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { listCertificates, listEligibleEnrollmentsForCertificate } from "@/lib/services/certificate-service";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { issueCertificate, revokeCertificate } from "./actions";
import { CertificateTable } from "@/components/certificates/certificate-table";
import { EligibleCompletionsTable } from "@/components/certificates/eligible-completions-table";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user || (!hasPermission(user, "certificates.view") && !hasPermission(user, "certificates.issue"))) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Certificates are not available for this account."
        description="Ask an administrator to assign certificate access."
      />
    );
  }

  const canIssue = hasPermission(user, "certificates.issue");
  const canRevoke = hasPermission(user, "certificates.revoke");

  const [certificates, eligible] = await Promise.all([
    listCertificates(canIssue ? undefined : user.id),
    canIssue ? listEligibleEnrollmentsForCertificate() : Promise.resolve([]),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Completion certificates are generated from verified course progress and can be checked publicly using their verification link."
      />

      {/* Eligible completions awaiting issuance */}
      {canIssue && eligible.length > 0 && (
        <EligibleCompletionsTable eligible={eligible} issueAction={issueCertificate} />
      )}

      {/* Main Certificate Register Table */}
      <CertificateTable
        certificates={certificates}
        canRevoke={canRevoke}
        revokeAction={revokeCertificate}
        title={canIssue ? "All Certificates" : "My Certificates"}
        description={
          canIssue
            ? "Comprehensive registry of all issued credentials, verification links, and governance controls."
            : "Your verified credentials and certificates awarded for completing course pathways."
        }
      />
    </section>
  );
}
