FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && install -d /usr/share/postgresql-common/pgdg \
  && curl --fail --silent --show-error --location https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  && printf 'Types: deb\nURIs: https://apt.postgresql.org/pub/repos/apt\nSuites: bookworm-pgdg\nComponents: main\nSigned-By: /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc\n' > /etc/apt/sources.list.d/pgdg.sources \
  && apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client-18 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY deploy/strapi-migration-worker/server.mjs ./server.mjs
COPY deploy/strapi-migration-worker/content-types.json ./content-types.json
COPY scripts/migration ./scripts/migration
COPY prisma ./prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile && DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" pnpm exec prisma generate

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server.mjs"]
