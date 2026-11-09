# Strapi migration worker

The worker is a private, short-lived migration service for the administrator portal. It restores PostgreSQL dumps into a dedicated staging database, reads the restored Strapi content through a staging Strapi API, and only writes to the platform database after an administrator reviews the preview and presses **Import into platform**.

## Deploy

Build from the root of the `santech-platform` repository, using `deploy/strapi-migration-worker/Dockerfile`. The image installs PostgreSQL 18 client tools to match the custom-format dump produced by pgAdmin's PostgreSQL 18 backup option. Keep the service private; do not expose it to the public internet. Attach a persistent volume at `/data` for job state and migration previews. The worker deletes the uploaded dump after preview generation and removes job directories older than seven days.

Provision a dedicated, disposable PostgreSQL database for staging and a separate Strapi instance deployed from the CMS repository. The staging Strapi instance and this worker must point to the same staging database. Never use the production CMS database for `STRAPI_MIGRATION_DATABASE_URL`.

## Worker environment

| Variable | Purpose |
| --- | --- |
| `PORT` | Worker HTTP port; default `8787`. |
| `STRAPI_MIGRATION_WORKER_TOKEN` | Shared bearer token used by the platform server. |
| `STRAPI_MIGRATION_DATABASE_URL` | Dedicated staging database URL; its `public` schema is reset before each restore. |
| `STRAPI_MIGRATION_STAGING_URL` | Private base URL for the Strapi instance connected to that staging database. |
| `STRAPI_MIGRATION_API_TOKEN` | Read-only Strapi API token with access to exported collections, users, and upload files. |
| `DATABASE_URL` | Target platform database URL used only when an administrator starts the import. |
| `MIGRATION_JOBS_DIRECTORY` | Optional persistent storage path; defaults to `/data/strapi-migrations`. |

Set `STRAPI_MIGRATION_WORKER_URL` and the same `STRAPI_MIGRATION_WORKER_TOKEN` on the platform app. Keep the staging and platform database URLs separate. Do not set the staging URL to the platform database.

## Workflow and safeguards

1. The worker streams a PostgreSQL custom-format `.dump` or `.backup` file to disk (maximum 2 GB). Plain SQL is rejected so arbitrary SQL or database switching commands are never executed by the upload service.
2. It resets only the configured staging `public` schema, restores the dump, exports all configured Strapi collections, users, and Cloudinary-backed upload metadata, and prepares the catalog validation report.
3. The portal polls the job and displays record counts and blocking validation errors.
4. The import endpoint reruns the existing idempotent catalog, content, users, and course-link migration scripts against `DATABASE_URL` only after explicit administrator action.

Cloudinary files are not copied into Postgres. Their URLs, provider metadata, and Strapi media relationships are imported so the references continue pointing at the existing Cloudinary assets.

Before using the portal, deploy and verify the worker, staging PostgreSQL database, and staging Strapi service. Configure the staging Strapi API token for read access only. The worker requires PostgreSQL client tools, includes a health check at `/healthz`, and accepts authenticated requests under `/v1/migrations/strapi`.
