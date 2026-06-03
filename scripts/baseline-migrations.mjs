/**
 * Mark all existing migrations as applied (for DBs created with `prisma db push`).
 * Safe to re-run: skips migrations already recorded (P3008).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.join("prisma", "migrations");
const names = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (names.length === 0) {
  console.error("No migrations found in prisma/migrations");
  process.exit(1);
}

function resolveApplied(name) {
  try {
    execSync(`npx prisma migrate resolve --applied "${name}"`, {
      stdio: "pipe",
      encoding: "utf8",
    });
    console.log(`  ✓ ${name} — marked as applied`);
    return "applied";
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
    if (out.includes("P3008") || out.includes("already recorded as applied")) {
      console.log(`  · ${name} — already applied (skipped)`);
      return "skipped";
    }
    console.error(`  ✗ ${name} — failed`);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

console.log("Baselining migrations (run after npm run db:push):\n");
let applied = 0;
let skipped = 0;
for (const name of names) {
  const result = resolveApplied(name);
  if (result === "applied") applied += 1;
  else skipped += 1;
}
console.log(`\nDone (${applied} new, ${skipped} already applied).`);
console.log("Next: npx prisma migrate deploy");
