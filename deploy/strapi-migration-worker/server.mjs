import { createServer } from "node:http";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
process.umask(0o077);
const jobRoot = path.resolve(process.env.MIGRATION_JOBS_DIRECTORY || "/data/strapi-migrations");
const maxBytes = 2 * 1024 * 1024 * 1024;
const jobs = new Map();
let pipelineBusy = false;

const required = ["STRAPI_MIGRATION_WORKER_TOKEN", "STRAPI_MIGRATION_DATABASE_URL", "STRAPI_MIGRATION_STAGING_URL", "STRAPI_MIGRATION_API_TOKEN", "DATABASE_URL"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required by the Strapi migration worker.`);

function authorized(request) {
  const header = request.headers.authorization || "";
  const expected = `Bearer ${process.env.STRAPI_MIGRATION_WORKER_TOKEN}`;
  const left = createHash("sha256").update(header).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    const output = [];
    let bytes = 0;
    for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { if (bytes < 24000) { output.push(chunk); bytes += chunk.length; } });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(Buffer.concat(output).toString("utf8")) : reject(new Error(`${command} failed (${code}): ${Buffer.concat(output).toString("utf8").slice(-6000)}`)));
  });
}

async function readJob(id) {
  const cached = jobs.get(id);
  if (cached) return cached;
  try {
    const job = JSON.parse(await readFile(path.join(jobRoot, id, "job.json"), "utf8"));
    jobs.set(id, job);
    return job;
  } catch {
    return null;
  }
}

async function update(job, changes) {
  Object.assign(job, changes, { updatedAt: new Date().toISOString() });
  jobs.set(job.id, job);
  await writeFile(path.join(jobRoot, job.id, "job.json"), JSON.stringify(job, null, 2));
}

async function streamDump(request, filePath) {
  const declaredSize = Number(request.headers["content-length"] || 0);
  if (!declaredSize || declaredSize > maxBytes) throw new Error("Database dump must be between 1 byte and 2 GB.");
  let received = 0;
  const limited = new (await import("node:stream")).Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(received > maxBytes ? new Error("Database dump exceeds the 2 GB limit.") : null, chunk);
    },
  });
  await pipeline(request, limited, createWriteStream(filePath, { flags: "wx" }));
  if (received !== declaredSize) throw new Error("The uploaded file size did not match its content length.");
}

async function restore(job, dumpPath) {
  const database = new URL(process.env.STRAPI_MIGRATION_DATABASE_URL);
  database.searchParams.delete("schema");
  const connectionString = database.toString();
  const restoreEnv = { ...process.env, PGDATABASE: connectionString };
  await spawnCommand("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-c", "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"], { env: restoreEnv });
  await spawnCommand("pg_restore", ["--no-owner", "--no-acl", "--exit-on-error", dumpPath], { env: restoreEnv });
}

async function strapiRequest(route) {
  const base = process.env.STRAPI_MIGRATION_STAGING_URL.replace(/\/$/, "");
  const response = await fetch(`${base}${route}`, { headers: { authorization: `Bearer ${process.env.STRAPI_MIGRATION_API_TOKEN}` }, cache: "no-store", signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`Staging Strapi export failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

async function exportStrapi(jobDir) {
  const types = JSON.parse(await readFile(path.join(root, "content-types.json"), "utf8"));
  const content = {};
  let entryCount = 0;
  for (const type of types) {
    if (type.kind === "singleType") {
      const response = await strapiRequest(`/api/${type.endpoint}?status=draft&populate=*`);
      content[type.key] = response;
      if (response?.data) entryCount += 1;
      continue;
    }
    const records = [];
    let page = 1;
    let pageCount = 1;
    do {
      const response = await strapiRequest(`/api/${type.endpoint}?status=draft&populate=*&pagination[page]=${page}&pagination[pageSize]=100`);
      records.push(...(response.data ?? []));
      pageCount = response.meta?.pagination?.pageCount ?? page;
      page += 1;
      if (page > 10000) throw new Error(`Pagination safety limit reached while exporting ${type.key}.`);
    } while (page <= pageCount);
    content[type.key] = { data: records, meta: { total: records.length } };
    entryCount += records.length;
  }

  const users = [];
  let page = 1;
  let pageCount = 1;
  do {
    const response = await strapiRequest(`/api/users?populate=role&pagination[page]=${page}&pagination[pageSize]=100`);
    for (const user of response ?? []) users.push({ id: user.id, email: user.email, username: user.username, firstName: user.firstName ?? null, lastName: user.lastName ?? null, phone: user.phone ?? null, provider: user.provider ?? null, confirmed: user.confirmed ?? false, blocked: user.blocked ?? false, role: user.role ? { id: user.role.id, name: user.role.name, type: user.role.type } : null, createdAt: user.createdAt ?? null, updatedAt: user.updatedAt ?? null });
    pageCount = response?.meta?.pagination?.pageCount ?? page;
    page += 1;
  } while (page <= pageCount);

  const files = [];
  page = 1;
  pageCount = 1;
  do {
    const response = await strapiRequest(`/api/upload/files?pagination[page]=${page}&pagination[pageSize]=100`);
    files.push(...(response.data ?? []));
    pageCount = response.meta?.pagination?.pageCount ?? page;
    page += 1;
  } while (page <= pageCount);

  const usersExport = { exportedAt: new Date().toISOString(), users };
  await writeFile(path.join(jobDir, "content.json"), JSON.stringify(content));
  await writeFile(path.join(jobDir, "users.json"), JSON.stringify(usersExport));
  return { contentEntries: entryCount, users: users.length, media: files.length };
}

async function prepareJob(job, directory) {
  const dumpPath = path.join(directory, `source${path.extname(job.fileName) || ".dump"}`);
  try {
    await update(job, { status: "RESTORING" });
    await restore(job, dumpPath);
    const exported = await exportStrapi(directory);
    const reportDir = path.join(directory, "report");
    await mkdir(reportDir, { recursive: true });
    await spawnCommand(process.execPath, [path.join(root, "scripts/migration/dry-run-strapi.mjs")], {
      cwd: root,
      env: { ...process.env, STRAPI_MIGRATION_DATABASE_URL: process.env.STRAPI_MIGRATION_DATABASE_URL, STRAPI_MIGRATION_OUTPUT_DIR: reportDir },
    });
    const reports = (await import("node:fs/promises")).readdir;
    const reportName = (await reports(reportDir)).filter((name) => name.endsWith(".json")).sort().at(-1);
    if (!reportName) throw new Error("The Strapi database preview report was not produced.");
    const reportPath = path.join(reportDir, reportName);
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    const content = JSON.parse(await readFile(path.join(directory, "content.json"), "utf8"));
    const contentEntries = Object.values(content).reduce((sum, value) => sum + (Array.isArray(value?.data) ? value.data.length : value?.data ? 1 : 0), 0);
    const userExport = JSON.parse(await readFile(path.join(directory, "users.json"), "utf8"));
    const counts = { ...exported, contentEntries, catalogItems: report.counts.catalogItems, categories: report.counts.categories, media: report.counts.media, users: userExport.users.length };
    const validationErrors = [...report.validation.errors];
    await update(job, { status: "PREVIEW_READY", preview: { ...counts, duplicateSlugGroups: report.counts.duplicateSlugGroups, validationErrors }, reportPath });
  } catch (error) {
    await update(job, { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 1500) : "Staging restore failed." });
  } finally {
    await rm(dumpPath, { force: true }).catch(() => {});
    pipelineBusy = false;
  }
}

async function importJob(job) {
  if (job.status !== "PREVIEW_READY" || job.preview?.validationErrors?.length) throw new Error("Only a preview without blocking validation errors can be imported.");
  if (pipelineBusy) throw new Error("Another migration is already using the staging database.");
  pipelineBusy = true;
  try {
    await update(job, { status: "IMPORTING" });
    const directory = path.join(jobRoot, job.id);
    const env = { ...process.env, STRAPI_DRY_RUN_REPORT: job.reportPath, STRAPI_CONTENT_FILE: path.join(directory, "content.json"), STRAPI_USERS_FILE: path.join(directory, "users.json") };
    await spawnCommand(process.execPath, [path.join(root, "scripts/migration/import-strapi-all.mjs")], { cwd: root, env });
    await update(job, { status: "COMPLETED", imported: { catalogItems: job.preview.catalogItems, contentEntries: job.preview.contentEntries, users: job.preview.users, media: job.preview.media } });
  } catch (error) {
    await update(job, { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 1500) : "Platform import failed." });
  } finally {
    pipelineBusy = false;
  }
}

await mkdir(jobRoot, { recursive: true, mode: 0o700 });
for (const name of await (await import("node:fs/promises")).readdir(jobRoot)) {
  const directory = path.join(jobRoot, name);
  try {
    const stats = await (await import("node:fs/promises")).stat(directory);
    if (!stats.isDirectory()) continue;
    if (Date.now() - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
      await rm(directory, { recursive: true, force: true });
      continue;
    }
    const jobFile = path.join(directory, "job.json");
    const job = JSON.parse(await readFile(jobFile, "utf8"));
    if (["UPLOADING", "RESTORING", "IMPORTING"].includes(job.status)) {
      Object.assign(job, { status: "FAILED", error: "The migration worker restarted during this job. Start a new preview; any partial platform import can be safely rerun.", updatedAt: new Date().toISOString() });
      await writeFile(jobFile, JSON.stringify(job, null, 2));
    }
  } catch { /* Ignore files concurrently removed by container cleanup. */ }
}
const server = createServer(async (request, response) => {
  try {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  if (request.method === "GET" && pathname === "/healthz") return json(response, 200, { ok: true });
  if (!authorized(request)) return json(response, 401, { error: "Unauthorized migration worker request." });

  if (request.method === "POST" && pathname === "/v1/migrations/strapi") {
    if (pipelineBusy) return json(response, 409, { error: "A migration is already using the isolated staging database." });
    let fileName;
    try {
      fileName = decodeURIComponent(String(request.headers["x-file-name"] || "strapi-database.dump")).replace(/[\\/\0]/g, "_");
    } catch {
      return json(response, 400, { error: "Invalid file name." });
    }
    if (!/\.(dump|backup)$/i.test(fileName)) return json(response, 415, { error: "Upload a PostgreSQL custom-format .dump or .backup file." });
    pipelineBusy = true;
    const id = randomUUID().replaceAll("-", "");
    const directory = path.join(jobRoot, id);
    let job;
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      job = { id, fileName, status: "UPLOADING", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await update(job, {});
      await streamDump(request, path.join(directory, `source${path.extname(fileName) || ".dump"}`));
    } catch (error) {
      if (job) await update(job, { status: "FAILED", error: error instanceof Error ? error.message : "File upload failed." }).catch(() => {});
      pipelineBusy = false;
      return json(response, 400, { ...(job ? { job } : {}), error: error instanceof Error ? error.message : "File upload failed." });
    }
    prepareJob(job, directory).catch(() => {});
    return json(response, 202, { job });
  }

  const statusMatch = pathname.match(/^\/v1\/migrations\/strapi\/([a-f0-9]{32})$/);
  if (request.method === "GET" && statusMatch) {
    const job = await readJob(statusMatch[1]);
    return job ? json(response, 200, { job }) : json(response, 404, { error: "Migration job not found." });
  }

  const importMatch = pathname.match(/^\/v1\/migrations\/strapi\/([a-f0-9]{32})\/import$/);
  if (request.method === "POST" && importMatch) {
    const job = await readJob(importMatch[1]);
    if (!job) return json(response, 404, { error: "Migration job not found." });
    if (job.status !== "PREVIEW_READY") return json(response, 409, { error: "This job is not ready to import." });
    importJob(job).catch(() => {});
    return json(response, 202, { job: { ...job, status: "IMPORTING" } });
  }

  return json(response, 404, { error: "Not found." });
  } catch (error) {
    if (!response.headersSent) json(response, 500, { error: error instanceof Error ? error.message.slice(0, 1000) : "Migration worker error." });
    else response.destroy();
  }
});

server.listen(Number(process.env.PORT || 8787), "0.0.0.0");
