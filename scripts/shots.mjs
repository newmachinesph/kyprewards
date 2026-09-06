/**
 * Screenshot walk of all five apps, for a visual review after a build.
 *
 * Signs in as the seeded owner, the seeded administrator (live TOTP) and the
 * seeded customer (the real one-time code, read from the dev sink), then
 * captures every navigable view into design/shots/. Public sites are walked
 * by route. Nothing here asserts; it exists so a person can look.
 *
 * Usage: node scripts/shots.mjs [business|admin|customer|marketing|marketplace ...]
 */

import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";
const urls = {
  business: process.env.BUSINESS_APP_URL ?? "http://localhost:3000",
  admin: process.env.ADMIN_APP_URL ?? "http://localhost:3001",
  customer: process.env.CUSTOMER_APP_URL ?? "http://localhost:3002",
  marketing: process.env.MARKETING_APP_URL ?? "http://localhost:3003",
  marketplace: process.env.MARKETPLACE_APP_URL ?? "http://localhost:3004",
};
// The seeded owner by default; overridable because the seeded shop is on Grow,
// and the plan a workspace is on changes most of what these screens render.
// Point them at a shop the free plan actually made and the walk captures what
// a Launch merchant sees rather than what a paid one does.
const OWNER = {
  email: process.env.OWNER_EMAIL ?? "mara@sweetcrumbs.ph",
  password: process.env.OWNER_PASSWORD ?? "DemoPass123!",
};
const ADMIN = { email: "admin@kypstamping.ph", password: "DemoPass123!" };
const ADMIN_MFA_SECRET = process.env.ADMIN_MFA_SECRET ?? "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
const CUSTOMER_MOBILE = process.env.CUSTOMER_MOBILE ?? "+63 917 555 0182";

const only = new Set(process.argv.slice(2));
const wants = (app) => only.size === 0 || only.has(app);
mkdirSync("design/shots", { recursive: true });

function totp(secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "")) bits += alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5, "0");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

const problems = [];
const browser = await chromium.launch({ headless: true });

function watch(page, label) {
  page.on("pageerror", (e) => problems.push(`${label} pageerror: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => {
    if (m.type() !== "error" || m.text().startsWith("Failed to load resource")) return;
    problems.push(`${label} console: ${m.text().slice(0, 160)}`);
  });
  page.on("response", (r) => {
    if (r.status() < 400 || !r.url().includes("/api/")) return;
    if (r.status() === 402 || r.status() === 404) return; // gates and unbuilt routes
    problems.push(`${label} ${r.status()} ${new URL(r.url()).pathname}`);
  });
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
async function shot(page, app, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `design/shots/${app}-${slug(name)}.png`, fullPage: true });
}

/** Click every distinct control in the shell's nav and capture the result. */
async function walkNav(page, app) {
  const items = page.locator("nav button, nav a, aside button, aside a");
  const seen = new Set();
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const text = ((await item.innerText().catch(() => "")) || "").trim().split("\n")[0];
    if (!text || seen.has(text) || /sign out|log out|close|menu/i.test(text)) continue;
    seen.add(text);
    try {
      await item.click({ timeout: 2500 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, app, text);
    } catch (e) {
      problems.push(`${app} nav "${text}": ${e.message.split("\n")[0].slice(0, 100)}`);
    }
  }
  // Views reachable from an account menu rather than the rail.
  for (const hash of process.env[`${app.toUpperCase()}_EXTRA_VIEWS`]?.split(",") ?? []) {
    await page.goto(`${urls[app]}/#${hash}`, { waitUntil: "networkidle" });
    await shot(page, app, hash);
  }
}

/* Business */
if (wants("business")) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, "business");
  await page.goto(`${urls.business}/login`, { waitUntil: "networkidle" });
  await shot(page, "business", "login");
  await page.getByLabel(/email/i).first().fill(OWNER.email);
  await page.locator('input[type="password"]').fill(OWNER.password);
  await page.getByRole("button", { name: /continue/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });
  await page.locator("#main-content").waitFor();
  await shot(page, "business", "dashboard");
  await walkNav(page, "business");
  await page.close();
}

/* Admin */
if (wants("admin")) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, "admin");
  await page.goto(`${urls.admin}/login`, { waitUntil: "networkidle" });
  await shot(page, "admin", "login");
  await page.getByLabel(/email/i).first().fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.getByRole("button", { name: /continue/i }).first().click();
  await page.waitForURL(/verify/, { timeout: 20_000 }).catch(() => {});
  const code = page.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"]').first();
  if (await code.count()) {
    await code.fill(totp(ADMIN_MFA_SECRET));
    await page.getByRole("button", { name: /verify|continue/i }).first().click();
  }
  await page.waitForURL((u) => !/login|verify/.test(u.pathname), { timeout: 20_000 });
  await page.locator("#main-content").waitFor();
  await shot(page, "admin", "overview");
  await walkNav(page, "admin");
  await page.close();
}

/* Customer wallet, phone and desktop */
if (wants("customer")) {
  const otp = async () => {
    const r = await fetch(`${API}/_dev/messages?purpose=otp&limit=1`);
    const rows = await r.json();
    return (rows[0]?.body ?? "").match(/\b(\d{6})\b/)?.[1];
  };
  for (const [tag, viewport] of [
    ["phone", { width: 390, height: 844 }],
    ["desktop", { width: 1440, height: 900 }],
  ]) {
    const page = await browser.newPage({ viewport });
    watch(page, `customer-${tag}`);
    await page.goto(`${urls.customer}/login`, { waitUntil: "networkidle" });
    await shot(page, "customer", `${tag}-login`);
    if (tag === "phone") {
      await page.getByLabel(/mobile number/i).fill(CUSTOMER_MOBILE);
      await page.getByRole("button", { name: /text me|send|code/i }).first().click();
      await page.waitForURL(/verify/, { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const code = await otp();
      if (code) {
        await page.getByLabel(/verification code/i).fill(code);
        await page.getByRole("button", { name: /verify|continue/i }).first().click();
        await page.waitForURL((u) => !/login|verify/.test(u.pathname), { timeout: 20_000 }).catch(() => {});
      }
      await shot(page, "customer", "phone-home");
      for (const tab of ["Wallet", "Discover", "Profile", "Home"]) {
        const t = page.getByRole("button", { name: new RegExp(`^${tab}$`, "i") }).last();
        if (await t.count()) {
          await t.click().catch(() => {});
          await page.waitForLoadState("networkidle").catch(() => {});
          await shot(page, "customer", `phone-${tab}`);
        }
      }
      for (const name of [/my qr|my code/i, /approve/i, /gifts?/i, /notifications?/i, /privacy/i, /joined/i, /consent/i, /download/i, /leave/i]) {
        const b = page.getByRole("button", { name }).first();
        if (await b.count()) {
          await b.click().catch(() => {});
          await page.waitForTimeout(600);
          await shot(page, "customer", `phone-${name.source}`);
          const back = page.getByRole("button", { name: /^(close|back)/i }).first();
          if (await back.count()) await back.click().catch(() => {});
        }
      }
      // Wallet cards: open the first three.
      const wallet = page.getByRole("button", { name: /^wallet$/i }).last();
      if (await wallet.count()) await wallet.click().catch(() => {});
      const cards = page.locator("main button, main [role=button]").filter({ hasText: /of \d+|Pending|Closed|Completed/ });
      const n = Math.min(await cards.count(), 4);
      for (let i = 0; i < n; i++) {
        await cards.nth(i).click().catch(() => {});
        await page.waitForTimeout(600);
        await shot(page, "customer", `phone-card-${i + 1}`);
        const back = page.getByRole("button", { name: /^(close|back)/i }).first();
        if (await back.count()) await back.click().catch(() => {});
      }
      await page.goto(`${urls.customer}/join/sweet-crumbs-kapitolyo`, { waitUntil: "networkidle" });
      await shot(page, "customer", "phone-join");
      await page.goto(`${urls.customer}/offline`, { waitUntil: "networkidle" });
      await shot(page, "customer", "phone-offline");
    } else {
      await page.goto(`${urls.customer}/`, { waitUntil: "networkidle" });
      await shot(page, "customer", "desktop-root");
      await page.goto(`${urls.customer}/join/sweet-crumbs-kapitolyo`, { waitUntil: "networkidle" });
      await shot(page, "customer", "desktop-join");
    }
    await page.close();
  }
}

/* Public sites by route */
const routes = {
  marketing: ["/", "/product", "/features", "/pricing", "/integrations", "/solutions", "/roadmap", "/faq", "/partners", "/contact"],
  marketplace: ["/", "/discover", "/discover?category=Bakery", "/shops/sweet-crumbs", "/categories/Bakery", "/neighborhoods/Kapitolyo", "/how-it-works", "/for-shops", "/shops/does-not-exist"],
};
for (const app of ["marketing", "marketplace"]) {
  if (!wants(app)) continue;
  for (const [tag, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["phone", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    watch(page, `${app}-${tag}`);
    for (const route of routes[app]) {
      await page.goto(`${urls[app]}${route}`, { waitUntil: "networkidle" }).catch((e) => problems.push(`${app} ${route}: ${e.message.slice(0, 100)}`));
      await shot(page, app, `${tag}-${route === "/" ? "home" : route}`);
    }
    await page.close();
  }
}

await browser.close();
console.log(problems.length ? `PROBLEMS\n${problems.join("\n")}` : "No problems seen.");
