import type { MigrationJob } from "../types";

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error ?? "The Strapi migration request failed.");
  return body;
}

export async function uploadStrapiDump(file: File) {
  const response = await fetch("/api/admin/migrations/strapi", {
    method: "POST",
    headers: { "content-type": "application/octet-stream", "x-file-name": encodeURIComponent(file.name) },
    body: file,
  });
  return readResponse<{ job: MigrationJob }>(response);
}

export async function getStrapiMigrationJob(id: string) {
  const response = await fetch(`/api/admin/migrations/strapi?jobId=${encodeURIComponent(id)}`);
  return readResponse<{ job: MigrationJob }>(response);
}

export async function importStrapiMigration(id: string) {
  const response = await fetch("/api/admin/migrations/strapi/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: id }),
  });
  return readResponse<{ job: MigrationJob }>(response);
}
