/**
 * Drive all four apps as a real user and report anything broken.
 *
 * Not a screenshot tour: it signs in as each persona, visits every screen,
 * and fails on a thrown error, a 4xx/5xx the UI did not ask for, horizontal
 * overflow, or a crash boundary. Console errors count too - a React key
 * warning is how a list quietly renders the wrong row.
 */
import { chromium } from "playwright";

const API = "http://localhost:8000/api/v1";
const APPS = {
  business: "http://localhost:3001",
  customer: "http://localhost:3002",
  marketing: "http://localhost:3003",
  admin: "http://localhost:3004",
};

const problems = [];
const note = (app, where, what) => problems.push(`${app.padEnd(10)} ${where.padEnd(30)} ${what}`);

function watch(page, app, where, { ignore = [] } = {}) {
  page.on("pageerror", (e) => note(app, where, `THREW ${e.message.slice(0, 90)}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (text.includes("Failed to load resource")) return;
    if (ignore.some((pattern) => text.includes(pattern))) return;
    note(app, where, `CONSOLE ${text.slice(0, 90)}`);
  });
  page.on("response", (r) => {
    if (!r.url().includes("/api/v1") || r.status() < 400) return;
    const path = r.url().split("/api/v1")[1];
    // Expected refusals: the plan gate, and a lookup miss driving the
    // walk-in prompt.
    if (path.includes("/approvals") && r.status() === 402) return;
    if (path.includes("customers/lookup") && r.status() === 404) return;
    note(app, where, `HTTP ${r.status()} ${path}`);
  });
}

async function check(page, app, where) {
  await page.waitForTimeout(1400);
  const body = await page.textContent("body").catch(() => "");
  if (/did not load|Something went wrong|Application error|Unhandled Runtime/i.test(body)) {
    note(app, where, "CRASH BOUNDARY");
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) note(app, where, `OVERFLOW ${overflow}px`);
}

const totp = async () => {
  const { createHmac } = await import("node:crypto");
  const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
  const ab = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret) bits += ab.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000 / 30)));
  const d = createHmac("sha1", key).update(ctr).digest();
  const o = d[d.length - 1] & 0x0f;
  return String((d.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, "0");
};

const browser = await chromium.launch();

/* ── Marketing: every public page, desktop and phone ─────────────── */
const PUBLIC = ["/", "/product", "/features", "/integrations", "/solutions",
  "/solutions/cafes-and-bakeries", "/pricing", "/compare", "/compare/gobalik", "/faq",
  "/resources", "/about", "/contact", "/partners", "/privacy", "/terms",
  "/loyalty-program-philippines"];
for (const [width, label] of [[1440, "desktop"], [390, "phone"]]) {
  for (const path of PUBLIC) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    watch(page, "marketing", `${label} ${path}`);
    const r = await page.goto(APPS.marketing + path, { waitUntil: "networkidle" }).catch(() => null);
    if (r?.status() !== 200) note("marketing", `${label} ${path}`, `STATUS ${r?.status()}`);
    await check(page, "marketing", `${label} ${path}`);
    await page.close();
  }
}
console.log("marketing swept");

/* ── Business: every screen behind the counter ───────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  watch(page, "business", "sign in");
  await page.goto(`${APPS.business}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "mara@sweetcrumbs.ph");
  await page.fill('input[type="password"]', "DemoPass123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  for (const view of ["dashboard", "scan", "join-code", "customers", "business", "programs",
    "favorite-orders", "birthday", "redemptions", "campaigns", "message-log", "analytics",
    "staff", "settings", "integrations"]) {
    watch(page, "business", `#${view}`);
    await page.goto(`${APPS.business}/#${view}`, { waitUntil: "networkidle" });
    await check(page, "business", `#${view}`);
  }
  await page.close();
  console.log("business swept");
}

/* ── Admin: every screen in the control room ─────────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  watch(page, "admin", "sign in");
  await page.goto(`${APPS.admin}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "admin@kyprewards.com");
  await page.fill('input[type="password"]', "DemoPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/verify/, { timeout: 15000 }).catch(() => {});
  await page.fill('input[inputmode="numeric"], input[type="text"]', await totp());
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3500);
  for (const view of ["overview", "businesses", "partners", "people", "operations",
    "integrations", "support", "audit", "economics", "settings"]) {
    watch(page, "admin", `#${view}`);
    await page.goto(`${APPS.admin}/#${view}`, { waitUntil: "networkidle" });
    await check(page, "admin", `#${view}`);
  }
  await page.close();
  console.log("admin swept");
}

/* ── Customer: the wallet, on a phone ────────────────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  watch(page, "customer", "sign in");
  await page.goto(`${APPS.customer}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /email/i }).first().click().catch(() => {});
  await page.fill('input[type="email"], input[type="tel"]', "jacqueline.daniel@example.com");
  await page.click('button[type="submit"]');
  await page.waitForURL(/verify/, { timeout: 15000 }).catch(() => {});
  const sent = await (await fetch(`${API}/_dev/messages?purpose=otp&limit=1`)).json();
  if (sent.length) {
    await page.fill('input[inputmode="numeric"], input[type="text"]', /\d{6}/.exec(sent[0].body)[0]);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    for (const view of ["home", "wallet", "discover", "profile"]) {
      watch(page, "customer", `#${view}`);
      await page.goto(`${APPS.customer}/#${view}`, { waitUntil: "networkidle" });
      await check(page, "customer", `#${view}`);
    }
  } else {
    note("customer", "sign in", "NO OTP SENT (rate limited?)");
  }
  await page.close();
  console.log("customer swept");
}

await browser.close();

console.log("\n" + "=".repeat(78));
if (problems.length === 0) {
  console.log("No problems found across all four apps.");
} else {
  console.log(`${problems.length} problem(s):\n`);
  for (const p of problems) console.log("  " + p);
}
