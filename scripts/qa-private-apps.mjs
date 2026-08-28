/**
 * Journeys through the two desk apps, against running servers.
 *
 * `qa:customer-auth` covered the wallet's way in; nothing covered the business
 * or platform workspaces. The largest class of defect found in the August
 * consistency review was state dying on navigation — a triaged ticket, an
 * edited program rule, a sent invitation — which a build and a typecheck
 * cannot see. This walks every view, then re-checks the three interactions
 * that used to announce a result they never produced.
 *
 * Start both apps first (`npm run build`, then `npm run start --workspace ...`),
 * or point BUSINESS_APP_URL / ADMIN_APP_URL at a deployment.
 */

import { chromium } from "playwright";

const businessUrl = process.env.BUSINESS_APP_URL ?? "http://localhost:3000";
const adminUrl = process.env.ADMIN_APP_URL ?? "http://localhost:3001";
/** Mirrors DEMO_CODE in packages/ui/src/auth.tsx and the README. */
const DEMO_CODE = "424242";

const BUSINESS_VIEWS = [
  "dashboard", "scan", "join-code", "customers", "business", "programs",
  "favorite-orders", "birthday", "redemptions", "campaigns", "message-log",
  "analytics", "integrations", "staff", "settings",
];
const ADMIN_VIEWS = [
  "overview", "businesses", "people", "operations", "integrations",
  "support", "audit", "economics", "settings",
];

const browser = await chromium.launch({ headless: true });
const problems = [];
const checks = [];

async function openApp(label, baseUrl, views, signIn) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => problems.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`${label} console: ${message.text()}`);
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await signIn(page);
  checks.push(`${label} sign-in journey`);

  for (const view of views) {
    await page.goto(`${baseUrl}/#${view}`, { waitUntil: "networkidle" });
    // A view that rendered has real copy; a crashed one leaves an empty main.
    const text = (await page.locator("#main-content").innerText()).trim();
    if (text.length < 40) {
      problems.push(`${label} #${view} rendered only ${text.length} characters`);
    }
  }
  checks.push(`${label}: ${views.length} views render`);
  return page;
}

/* ── Business workspace ───────────────────────────────────────────── */

const business = await openApp("business", businessUrl, BUSINESS_VIEWS, async (page) => {
  await page.getByRole("button", { name: "Continue securely" }).click();
  await page.waitForURL(/workspaces/);
  await page.getByRole("button", { name: /Open selected workspace/i }).click();
  await page.waitForURL(/#dashboard/);
});

// "Invite staff" used to open the recipient's acceptance screen.
await business.goto(`${businessUrl}/#staff`, { waitUntil: "networkidle" });
await business.getByRole("button", { name: "Invite staff" }).click();
await business.getByLabel("Name").fill("Tala Reyes");
await business.getByRole("button", { name: "Send invitation" }).click();
if (!(await business.getByText("Tala Reyes").first().isVisible())) {
  problems.push("business: an invited staff member did not appear in the table");
}
checks.push("business: staff invitation reaches the roster");

// "Edit rules" used to be a toast over an unused store method.
await business.goto(`${businessUrl}/#programs`, { waitUntil: "networkidle" });
await business.getByRole("button", { name: "Edit rules" }).click();
await business.getByLabel("Program name").fill("Nine visits, pastry on us");
await business.goto(`${businessUrl}/#dashboard`, { waitUntil: "networkidle" });
await business.goto(`${businessUrl}/#programs`, { waitUntil: "networkidle" });
if (!(await business.getByText("Nine visits, pastry on us").first().isVisible())) {
  problems.push("business: a program rule edit did not survive navigation");
}
checks.push("business: program edits survive navigation");

/* ── Platform control room ────────────────────────────────────────── */

const admin = await openApp("admin", adminUrl, ADMIN_VIEWS, async (page) => {
  await page.getByRole("button", { name: "Continue securely" }).click();
  await page.waitForURL(/verify/);
  await page.getByLabel(/verification code/i).fill(DEMO_CODE);
  await page.getByRole("button", { name: /Verify/i }).click();
  await page.waitForURL(/#overview/);
});

// Triage was per-view state, and the badge counted the fixture instead.
await admin.goto(`${adminUrl}/#support`, { waitUntil: "networkidle" });
const openBefore = await admin.getByText(/\d+ open/).first().innerText();
await admin.getByLabel("Status").selectOption("Investigating");
await admin.goto(`${adminUrl}/#audit`, { waitUntil: "networkidle" });
await admin.goto(`${adminUrl}/#support`, { waitUntil: "networkidle" });
const openAfter = await admin.getByText(/\d+ open/).first().innerText();
if (openBefore === openAfter) {
  problems.push(
    `admin: the open count did not move after triage (${openBefore} then ${openAfter})`,
  );
}
checks.push("admin: triage persists and the open count follows it");

// "Replay failed events" reported three moved and left the counter at three.
await admin.goto(`${adminUrl}/#integrations`, { waitUntil: "networkidle" });
await admin.getByRole("button", { name: "Replay failed events" }).click();
await admin.getByRole("button", { name: "Nothing to replay" }).waitFor({ timeout: 5000 });
checks.push("admin: the recovery queue empties when replayed");

await browser.close();

if (problems.length) {
  console.error(`Private-app QA failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
}
