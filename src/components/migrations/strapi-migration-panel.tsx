"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Database, FileUp, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useImportStrapiMigration, useStrapiMigrationJob, useUploadStrapiDump } from "@/features/strapi-migration";
import type { MigrationJob } from "@/features/strapi-migration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const activeStatuses = new Set(["UPLOADING", "RESTORING", "IMPORTING"]);
const statusText: Record<MigrationJob["status"], string> = {
  UPLOADING: "Uploading dump",
  RESTORING: "Restoring to isolated staging database",
  PREVIEW_READY: "Preview ready",
  IMPORTING: "Importing into platform",
  COMPLETED: "Migration complete",
  FAILED: "Migration failed",
};

function readableError(error: unknown) {
  return error instanceof Error ? error.message : "The migration request failed.";
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-muted/50 px-4 py-3"><p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}

export function StrapiMigrationPanel() {
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const upload = useUploadStrapiDump();
  const importJob = useImportStrapiMigration();
  const jobQuery = useStrapiMigrationJob(jobId);
  const job = jobQuery.data?.job;
  const active = job ? activeStatuses.has(job.status) : false;
  const mutationError = upload.error ?? importJob.error ?? jobQuery.error;

  React.useEffect(() => {
    setJobId(window.localStorage.getItem("strapi-migration-job-id"));
  }, []);

  function chooseFile(selected: File | null) {
    setInputError(null);
    if (!selected) return setFile(null);
    if (!/\.(dump|backup)$/i.test(selected.name)) {
      setFile(null);
      setInputError("Choose a PostgreSQL custom-format .dump or .backup file.");
      return;
    }
    if (selected.size > 2 * 1024 * 1024 * 1024) {
      setFile(null);
      setInputError("The dump must be 2 GB or smaller.");
      return;
    }
    setFile(selected);
  }

  function startUpload() {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: ({ job: newJob }) => {
        setJobId(newJob.id);
        window.localStorage.setItem("strapi-migration-job-id", newJob.id);
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
      },
    });
  }

  function startImport() {
    if (!job || job.status !== "PREVIEW_READY" || (job.preview?.validationErrors.length ?? 1) > 0) return;
    const approved = window.confirm("Import this preview into the configured platform database? Existing matching records will be updated. Check your database backup before continuing.");
    if (approved) importJob.mutate(job.id);
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Database className="size-4" /> Data migration</div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Strapi database</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Upload the production dump, inspect the mapped records from an isolated restore, then explicitly import them into the platform.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex gap-3 rounded-lg border bg-card p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Staged before import</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The dump is restored to a separate temporary database for review.</p></div></div>
        <div className="flex gap-3 rounded-lg border bg-card p-4"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Administrator only</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Only the active platform administrator can access this workflow.</p></div></div>
        <div className="flex gap-3 rounded-lg border bg-card p-4"><Database className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Cloudinary files stay hosted</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The migration preserves their saved media URLs and metadata.</p></div></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileUp className="size-5 text-primary" /> Upload a database dump</CardTitle>
          <CardDescription>Supported formats: PostgreSQL custom-format .dump and .backup files. Maximum file size: 2 GB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input ref={fileInput} type="file" accept=".dump,.backup,application/octet-stream" disabled={active || upload.isPending} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
          {file ? <p className="text-sm text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p> : null}
          {inputError ? <p role="alert" className="text-sm text-destructive">{inputError}</p> : null}
          {mutationError ? <p role="alert" className="text-sm text-destructive">{readableError(mutationError)}</p> : null}
          <Button onClick={startUpload} disabled={!file || active || upload.isPending}>
            {upload.isPending || active ? <LoaderCircle className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {upload.isPending ? "Uploading…" : active ? statusText[job!.status] : "Upload and prepare preview"}
          </Button>
        </CardContent>
      </Card>

      {job ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1"><CardTitle>Migration preview</CardTitle><CardDescription>{job.fileName} · submitted {new Date(job.createdAt).toLocaleString()}</CardDescription></div>
            <Badge variant={job.status === "FAILED" ? "destructive" : job.status === "COMPLETED" ? "default" : "secondary"}>{statusText[job.status]}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {active ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />The migration worker is processing this dump. This page refreshes the job status automatically.</div> : null}
            {job.status === "FAILED" ? <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="size-4 shrink-0" />{job.error ?? "The worker could not prepare this dump."}</div> : null}
            {job.preview ? <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Count label="Catalog items" value={job.preview.catalogItems} />
                <Count label="Categories" value={job.preview.categories} />
                <Count label="Media records" value={job.preview.media} />
                <Count label="Website content entries" value={job.preview.contentEntries} />
                <Count label="User accounts" value={job.preview.users} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Validation</p>
                {job.preview.validationErrors.length ? <ul className="space-y-1 text-sm text-destructive">{job.preview.validationErrors.map((error, index) => <li key={`${index}-${error}`} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</li>)}</ul> : <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />No blocking data issues found. {job.preview.duplicateSlugGroups} duplicate slug groups need review.</p>}
              </div>
              {job.status === "PREVIEW_READY" ? <Button onClick={startImport} disabled={importJob.isPending || job.preview.validationErrors.length > 0}>{importJob.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Database className="size-4" />}{importJob.isPending ? "Starting import…" : "Import into platform"}</Button> : null}
              {job.status === "COMPLETED" && job.imported ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-medium">Import finished</p><p className="mt-1">{job.imported.catalogItems.toLocaleString()} catalog items, {job.imported.contentEntries.toLocaleString()} website entries, {job.imported.users.toLocaleString()} users, and {job.imported.media.toLocaleString()} media references were processed.</p></div> : null}
            </> : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="max-w-3xl text-xs leading-5 text-muted-foreground">Import writes to the platform database configured on the migration worker. Confirm that target before importing. Imported accounts without compatible password hashes must use the platform password reset flow.</p>
              <Button variant="outline" size="sm" onClick={() => jobQuery.refetch()} disabled={jobQuery.isFetching}><RefreshCw className={`size-4 ${jobQuery.isFetching ? "animate-spin" : ""}`} />Refresh status</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
