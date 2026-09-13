/**
 * Every QA suite, in order, against a freshly seeded database.
 *
 * The suites share one database with the backend's pytest and with each
 * other, and several of them spend the seeded shop's rate limits, so they
 * cannot run together and cannot run twice against the same seed. This walks
 * them one at a time and reseeds between - which is the part that was being
 * done by hand, differently each time.
 *
 * It refuses to start while any app is serving preview data. That is not
 * caution: `withPreviewExtras` appends sample rows to real lists, so a browser
 * suite asserting "the new card is on the home screen" passes on a sample card
 * belonging to nobody. A whole run has already been thrown away to this, and
 * one assertion had been failing unnoticed for eleven commits behind it.
 *
 * Usage: npm run qa:all [suite ...]
 */

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Behaviour first, then the public sites, then the model check. */
const SUITES = [
  "journey",
  "free-tier",
  "merchant",
  "wallet",
  "customer-auth",
  "edges",
  "tenants",
  "refusals",
  "marketing",
  "marketplace",
  "private-apps",
  "fuzz",
];

const APPS = ["admin-web", "business-web", "customer-pwa", "marketing-site", "marketplace"];

/**
 * Apps configured to serve preview data.
 *
 * Read from the files rather than asked of the servers, because there is
 * nothing public to ask: the appending seam (`withPreviewExtras`) is behind a
 * customer session, and the marketplace only falls back to samples when the
 * API is down. So this cannot see a dev server that was started with the flag
 * in its environment instead - that is what NEXT_PUBLIC_PREVIEW_UNBUILT=false
 * in this runner's own environment declares, and it is taken at its word.
 */
function previewApps() {
  if (process.env.NEXT_PUBLIC_PREVIEW_UNBUILT === "false") return [];
  return APPS.filter((app) => {
    try {
      return /^NEXT_PUBLIC_PREVIEW_UNBUILT=true\s*$/m.test(
        readFileSync(join(root, "apps", app, ".env.local"), "utf8"),
      );
    } catch {
      // No file is no preview. A missing env is the dev server's problem, and
      // it will say so louder than this can.
      return false;
    }
  });
}

function reseed() {
  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      join(root, "..", "backend", "compose.backend.yaml"),
      "exec",
      "-T",
      "api",
      "python",
      "scripts/seed.py",
    ],
    { stdio: "ignore" },
  );
  // Throttles are real now: failed sign-ins and second-factor guesses are
  // saved, and sign-in writes are counted per address. Suites that try wrong
  // codes on purpose would otherwise lock the admin out of the next suite.
  // Local only - this deletes throttle state, never product data.
  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      join(root, "..", "backend", "compose.backend.yaml"),
      "exec",
      "-T",
      "api",
      "python",
      "-c",
      [
        "import asyncio",
        "from sqlalchemy import delete",
        "from redis.asyncio import Redis",
        "from app.config import settings",
        "from app.db import SessionFactory",
        "from app.models import LoginAttempt, OtpCode",
        "async def main():",
        "    async with SessionFactory() as db:",
        "        await db.execute(delete(LoginAttempt))",
        "        await db.execute(delete(OtpCode))",
        "        await db.commit()",
        "    redis = Redis.from_url(settings.cache_url)",
        "    keys = [key async for key in redis.scan_iter('rl:*')]",
        "    if keys:",
        "        await redis.delete(*keys)",
        "    await redis.aclose()",
        "asyncio.run(main())",
      ].join(String.fromCharCode(10)),
    ],
    { stdio: "ignore" },
  );
}

const asked = process.argv.slice(2);
const unknown = asked.filter((s) => !SUITES.includes(s));
if (unknown.length) {
  console.error(`Unknown suite(s): ${unknown.join(", ")}\nKnown: ${SUITES.join(", ")}`);
  process.exit(2);
}
const suites = asked.length ? asked : SUITES;

const previewing = previewApps();
if (previewing.length) {
  console.error(
    `Preview data is on in ${previewing.join(", ")}.\n` +
      "Sample rows are appended to real lists, so these suites would be asserting\n" +
      "against data no user has. Restart the dev servers with\n" +
      "NEXT_PUBLIC_PREVIEW_UNBUILT=false in their environment, and set the same\n" +
      "in this command's environment so this check knows you did.",
  );
  process.exit(2);
}

const results = [];
for (const suite of suites) {
  reseed();
  const started = Date.now();
  const run = spawnSync("npm", ["run", "--silent", `qa:${suite}`], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const seconds = Math.round((Date.now() - started) / 1000);
  results.push({ suite, code: run.status ?? 1, seconds });
  console.log(`\n──── ${suite}: ${run.status === 0 ? "pass" : "FAIL"} in ${seconds}s\n`);
}

const failed = results.filter((r) => r.code !== 0);
console.log("─".repeat(46));
for (const r of results) {
  console.log(`  ${r.code === 0 ? "ok  " : "FAIL"} ${r.suite.padEnd(16)} ${r.seconds}s`);
}
console.log(
  `─ ${results.length} suite(s), ${failed.length} failure(s) ` + "─".repeat(14),
);
process.exit(failed.length ? 1 : 0);
