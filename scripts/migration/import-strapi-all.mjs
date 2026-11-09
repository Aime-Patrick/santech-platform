import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const scriptDir = path.resolve(root, "scripts", "migration");
const cmsTmp = path.resolve(root, "..", "cms", "tmp");

// Prisma loads .env automatically, but these migration scripts run directly with Node.
// Load missing values from .env while allowing explicit shell variables to win.
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must point to the target platform database.");
}

const run = (script, args = []) => {
  console.log(`\n▶ ${script} ${args.join(" ")}`);
  execFileSync(process.execPath, [path.join(scriptDir, script), ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
};

const newest = (pattern) => {
  if (!fs.existsSync(cmsTmp)) return null;
  const entries = fs.readdirSync(cmsTmp, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(pattern))
    .map((entry) => {
      const directory = path.join(cmsTmp, entry.name);
      const fileName = pattern === "strapi-export-" ? "content.json" : "users.json";
      const file = path.join(directory, fileName);
      return fs.existsSync(file) ? { file, mtime: fs.statSync(file).mtimeMs } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime)[0];
  return entries?.file ?? null;
};

console.log("Starting Strapi → platform migration");
console.log("Target database is configured through DATABASE_URL.");

// The migration worker may already have produced a reviewed report from its isolated restore.
// Local migrations keep the existing Docker-backed dry-run behavior.
if (!process.env.STRAPI_DRY_RUN_REPORT) run("dry-run-strapi.mjs");
else if (!fs.existsSync(process.env.STRAPI_DRY_RUN_REPORT)) throw new Error("STRAPI_DRY_RUN_REPORT does not exist.");

// Catalog import consumes the newest dry-run report and writes to the platform DB.
const reportArg = process.env.STRAPI_DRY_RUN_REPORT ? [`--report=${process.env.STRAPI_DRY_RUN_REPORT}`] : [];
run("import-strapi-catalog.mjs", [...reportArg, "--write"]);

const contentFile = process.env.STRAPI_CONTENT_FILE || newest("strapi-export-");
if (contentFile) {
  run("import-strapi-content.mjs", [`--file=${contentFile}`, "--write"]);
} else {
  console.warn("⚠ No Strapi content.json export found; website content was skipped.");
}

const usersFile = process.env.STRAPI_USERS_FILE || newest("strapi-users-");
if (usersFile) {
  run("import-strapi-users.mjs", [`--file=${usersFile}`, "--write"]);
} else {
  console.warn("⚠ No Strapi users.json export found; user import was skipped.");
}

run("link-catalog-courses.mjs", ["--write"]);
console.log("\n✓ Strapi → platform migration completed.");
