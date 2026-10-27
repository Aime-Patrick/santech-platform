import { redirect } from "next/navigation";
import { FileText, Paperclip } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { listLearnerApplications, listPublishedCoursesForApplication } from "@/lib/services/application-service";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationSubmitForm } from "@/components/applications/application-submit-form";
import { PageHeader } from "@/components/shared/page-header";

function formatBytes(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type LearnerApplication = Awaited<ReturnType<typeof listLearnerApplications>>[number];

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (user && hasPermission(user, "applications.review")) redirect("/dashboard/application-review");
  if (!user || !hasPermission(user, "applications.create")) {
    return (
      <EmptyState
        icon={FileText}
        eyebrow="Learner workspace"
        title="Applications are available to learners."
        description="Sign in with a learner account to submit an application and track its progress."
      />
    );
  }

  const [courses, applications] = await Promise.all([
    listPublishedCoursesForApplication(),
    listLearnerApplications(user.id),
  ]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="My applications"
        description="Submit an application and follow every decision from one learner workspace."
      />

      <Card className="border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-[#123568]">
              <FileText className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">New application</p>
              <h2 className="mt-1 text-xl font-bold text-[#0a1f44]">Start an application</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the opportunity that matches your goals and tell us about your interest.</p>
            </div>
          </div>
        </div>

        <ApplicationSubmitForm courses={courses} />
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your history</p>
            <h2 className="mt-1 text-xl font-bold text-[#0a1f44]">Submitted applications</h2>
          </div>
          <span className="text-sm text-slate-500">{applications.length} {applications.length === 1 ? "application" : "applications"}</span>
        </div>

        {applications.length === 0 ? (
          <EmptyState icon={FileText} title="No applications yet" description="Your submitted applications and supporting files will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {applications.map((application: LearnerApplication) => (
              <Card key={application.id} className="border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{application.type}</p>
                    <h3 className="mt-1 font-bold text-[#0a1f44]">{application.course?.title ?? "General application"}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatStatus(application.status)}</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{application.coverLetter}</p>
                {application.files.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {application.files.map((file) => (
                      <a key={file.id} href={file.secureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                        <Paperclip className="size-3.5" />{file.name} · {formatBytes(file.bytes)}
                      </a>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}



