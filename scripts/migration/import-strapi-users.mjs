import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const write = process.argv.includes("--write");
const fileArg = process.argv.find((value) => value.startsWith("--file="))?.slice("--file=".length);
if (!fileArg) throw new Error("Pass --file=PATH to the exported Strapi users.json file.");
const sourcePath = path.resolve(fileArg);
const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const records = Array.isArray(source) ? source : source.users;
if (!Array.isArray(records)) throw new Error("The users export must contain a users array.");

function nameParts(record) {
  const fallback = String(record.username ?? record.email.split("@")[0] ?? "Learner").replace(/[._-]+/g, " ").trim();
  const parts = fallback.split(/\s+/).filter(Boolean);
  return {
    firstName: String(record.firstName ?? parts[0] ?? "Learner").trim().slice(0, 80) || "Learner",
    lastName: String(record.lastName ?? parts.slice(1).join(" ") ?? "User").trim().slice(0, 80) || "User",
  };
}

const valid = records
  .map((record) => ({ ...record, email: String(record.email ?? "").trim().toLowerCase() }))
  .filter((record) => record.email.includes("@"));

const summary = {
  source: sourcePath,
  sourceUsers: records.length,
  validUsers: valid.length,
  skippedUsers: records.length - valid.length,
  mode: write ? "write" : "preview",
  passwordPolicy: "Imported accounts have no passwordHash and must accept an invitation or reset their password.",
};

if (!write) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --write mode.");

const prisma = new PrismaClient();
try {
  const result = await prisma.$transaction(async (tx) => {
    let imported = 0;
    let updated = 0;
    let invited = 0;
    for (const record of valid) {
      const { firstName, lastName } = nameParts(record);
      const isAdmin = record.sourceType === "strapi-admin";
      const status = record.blocked || record.isActive === false ? "SUSPENDED" : (isAdmin ? "ACTIVE" : "INVITED");
      const existing = await tx.user.findUnique({
        where: { email: record.email },
        select: { id: true, passwordHash: true, status: true },
      });
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              firstName,
              lastName,
              phone: record.phone ? String(record.phone).slice(0, 40) : undefined,
              status: existing.passwordHash ? existing.status : status,
            },
          })
        : await tx.user.create({
            data: {
              email: record.email,
              firstName,
              lastName,
              phone: record.phone ? String(record.phone).slice(0, 40) : null,
              status,
            },
          });
      const targetRole = await tx.role.findUnique({ where: { key: isAdmin ? "administrator" : "learner" }, select: { id: true } });
      if (targetRole) {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: targetRole.id } },
          update: {},
          create: { userId: user.id, roleId: targetRole.id },
        });
      }
      if (record.id != null) {
        await tx.externalIdentity.upsert({
          where: { provider_subject: { provider: "strapi-users-permissions", subject: String(record.id) } },
          update: { userId: user.id },
          create: { provider: "strapi-users-permissions", subject: String(record.id), userId: user.id },
        });
      }
      imported += 1;
      if (existing) updated += 1;
      if (!existing || !existing.passwordHash) invited += 1;
    }
    return { imported, updated, invited };
  });
  console.log(JSON.stringify({ ...summary, result }, null, 2));
} finally {
  await prisma.$disconnect();
}

