# Frontend (Next.js App Router)

This platform provides:

- Auth pages (`/login`, `/register`)
- Protected, permission-filtered dashboard routes
- SAN TECH CMS-aligned dashboard layout with sidebar and topbar
- Prisma-backed roles, permissions, sessions, courses, enrollments, applications, and certificates
- Reusable UI primitives, empty states, and access-boundary states

## Environment

Copy and configure:

```bash
cp .env.example .env.local
```

The platform expects the variables in `.env.example` for PostgreSQL, administrator seeding, Cloudinary, and email delivery. Copy that file to `.env.local` and fill in the values before running Prisma commands.

## Database commands

```bash
pnpm run db:up
pnpm run db:generate
pnpm run db:migrate --name init
pnpm run db:seed
```

The local PostgreSQL database runs through Docker Compose on host port `5438` and persists data in the `santech_platform_postgres_data` volume. Use `pnpm run db:down` to stop the container and `pnpm run db:logs` to inspect its logs.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding if you want the seed command to create the first administrator account. The password is hashed before it is stored.

## Development

```bash
pnpm install
pnpm run dev -- --port 3001
```

## Quality checks

```bash
pnpm run lint
pnpm run build
```
