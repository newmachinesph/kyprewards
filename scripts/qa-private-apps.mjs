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
 * or point BUSINESS_APP_URL / ADMIN_APP_URL at a deployment. The API has to be
 * up and seeded too: sign-in is the server's answer now, not a sessionStorage
 * flag, so this walks the real auth path.
 */

import { createHmac } from "node:crypto";
import { chromium } from "playwright";

const businessUrl = process.env.BUSINESS_APP_URL ?? "http://localhost:3000";
const adminUrl = process.env.ADMIN_APP_URL ?? "http://localhost:3001";

/**
 * The seeded demo accounts, matching `DEMO_PASSWORD` in the API's seed script.
 *
 * The password field used to carry a checked-in default and the code used to
 * be a fixed "424242" the browser compared for itself. Both went when auth
 * became real, so this script has to type a password and compute a live TOTP
 * exactly as a person with an authenticator would.
 */
const OWNER_EMAIL = process.env.DEMO_EMAIL ?? "mara@sweetcrumbs.ph";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@kypstamping.ph";
const OWNER_PASSWORD = process.env.DEMO_PASSWORD ?? "DemoPass123!";
const ADMIN_MFA_SECRET = process.env.ADMIN_MFA_SECRET ?? "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

/** RFC 6238, 30-second step, 6 digits. Same helper as the contract tests. */
function totp(secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replace(/=+$/, "")) {
    bits += alphabet.indexOf(character.toUpperCase()).toString(2).padStart(5, "0");
  }
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

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
    // The browser logs "Failed to load resource: …" for every non-2xx and
    // names neither the route nor the reason. The response listener below
    // reports those properly, so this only carries real page errors.
    if (message.type() !== "error") return;
    if (message.text().startsWith("Failed to load resource")) return;
    problems.push(`${label} console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    if (!response.url().includes("/api/")) return;
    // 402 is a plan gate, which is an answer rather than a fault: a card
    // below its plan renders an upgrade line from exactly this response.
    if (response.status() === 402) return;
    problems.push(`${label} ${response.status()} ${new URL(response.url()).pathname}`);
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
  // Both typed. The email field used to arrive pre-filled with the demo
  // owner's address; it is a placeholder now, because a real person signing up
  // was being handed somebody else's identity. An owner with exactly one
  // workspace no longer passes a picker - the API says `needsWorkspace: false`
  // and the app goes straight to the dashboard.
  await page.getByLabel(/email/i).first().fill(OWNER_EMAIL);
  await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Continue securely" }).click();
  // The app lands on its root and picks the default view; the hash only
  // appears once something navigates. Waiting for `#dashboard` waited forever.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await page.locator("#main-content").waitFor();
});

// "Invite staff" used to open the recipient's acceptance screen.
await business.goto(`${businessUrl}/#staff`, { waitUntil: "networkidle" });
await business.getByRole("button", { name: "Invite staff" }).click();
await business.getByLabel("Name").fill("Tala Reyes");
// An invitation is a signed link that has to reach somebody, so the composer
// refuses to send without an address. Filling only the name sent nothing and
// this check passed on a roster that had not changed.
await business.getByLabel("Email").fill(`tala.reyes.${Date.now()}@sweetcrumbs.ph`);
await business.getByRole("button", { name: "Send invitation" }).click();
await business.getByText("Tala Reyes").first().waitFor({ timeout: 10_000 });
if (!(await business.getByText("Tala Reyes").first().isVisible())) {
  problems.push("business: an invited staff member did not appear in the table");
}
checks.push("business: staff invitation reaches the roster");

// "Edit rules" used to be a toast over an unused store method.
await business.goto(`${businessUrl}/#programs`, { waitUntil: "networkidle" });
await business.getByRole("button", { name: "Edit rules" }).click();
await business.getByLabel("Program name").fill("Nine visits, pastry on us");
// The draft is a draft until it is published. Navigating away from an unsaved
// editor is supposed to lose it - the check is that a *saved* rule survives.
await business.getByRole("button", { name: "Publish new version" }).click();
await business.getByText("Nine visits, pastry on us").first().waitFor({ timeout: 10_000 });
await business.goto(`${businessUrl}/#dashboard`, { waitUntil: "networkidle" });
await business.goto(`${businessUrl}/#programs`, { waitUntil: "networkidle" });
if (!(await business.getByText("Nine visits, pastry on us").first().isVisible())) {
  problems.push("business: a program rule edit did not survive navigation");
}
checks.push("business: program edits survive navigation");

/* ── Platform control room ────────────────────────────────────────── */

const admin = await openApp("admin", adminUrl, ADMIN_VIEWS, async (page) => {
  await page.getByLabel(/email/i).first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Continue securely" }).click();
  await page.waitForURL(/verify/);
  // A real second factor: the API verifies this, so a fixed demo code no
  // longer gets in.
  await page.getByLabel(/verification code/i).fill(totp(ADMIN_MFA_SECRET));
  await page.getByRole("button", { name: /Verify/i }).click();
  await page.waitForURL((url) => !/\/(login|verify)/.test(url.pathname));
  await page.locator("#main-content").waitFor();
});

// Triage was per-view state, and the badge counted the fixture instead.
await admin.goto(`${adminUrl}/#support`, { waitUntil: "networkidle" });
const openCount = async () =>
  // innerText returns the rendered text, and the badge is uppercased in CSS.
  Number(/(\d+)\s+open/i.exec(await admin.getByText(/\d+ open/).first().innerText())?.[1]);

const openBefore = await openCount();
// A ticket that is actually Open, rather than whichever row happens to be
// first: moving an already-investigating ticket to Investigating changes the
// database and not the badge, which read as a failure of the badge.
const openRow = admin.locator("button", { hasText: "· Open" }).first();
if ((await openRow.count()) === 0) {
  problems.push("admin: no open ticket to triage");
} else {
  await openRow.click();
  // A note first: the API refuses "Investigating" without one, and this used
  // to drive a transition the database never accepted while the console
  // reported it had.
  await admin.getByLabel("Internal note").fill("Reproduced on the sandbox tenant.");
  await admin.getByLabel("Status").selectOption("Investigating");
  await admin.waitForTimeout(750);
  await admin.goto(`${adminUrl}/#audit`, { waitUntil: "networkidle" });
  await admin.goto(`${adminUrl}/#support`, { waitUntil: "networkidle" });
  const openAfter = await openCount();
  if (openAfter !== openBefore - 1) {
    problems.push(
      `admin: the open count did not move after triage (${openBefore} then ${openAfter})`,
    );
  }
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
