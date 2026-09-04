/**
 * A customer's wallet, driven for real.
 *
 * Sign in, look at the cards, show the code, join somewhere new, change a
 * consent, ask for the data export - the things a person actually does - with
 * every console error, page error and failing request recorded.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3002";
const API = "http://localhost:8000/api/v1";
const problems = [];
const did = [];

const otp = async () => {
  const r = await fetch(`${API}/_dev/messages?purpose=otp&limit=1`);
  const [m] = await r.json();
  return /\d{6}/.exec(m?.body ?? "")?.[0] ?? "";
};

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 414, height: 896 },
  isMobile: true,
  hasTouch: true,
});
const p = await ctx.newPage();

p.on("pageerror", (e) => problems.push(`PAGE ERROR: ${e.message.slice(0, 200)}`));
p.on("console", (m) => {
  if (m.type() !== "error") return;
  if (m.text().startsWith("Failed to load resource")) return;
  problems.push(`CONSOLE: ${m.text().slice(0, 200)}`);
});
p.on("response", async (r) => {
  if (!r.url().includes("/api/") || r.status() < 400) return;
  const path = new URL(r.url()).pathname;
  // Signed out is the point of the first screens, and the suite deliberately
  // sends one wrong code.
  if (r.status() === 401 && /auth\/(session|otp\/verify)$/.test(path)) return;
  const body = await r.text().catch(() => "");
  problems.push(`HTTP ${r.status()} ${r.request().method()} ${path} ${body.slice(0, 160)}`);
});

const step = async (label, fn) => {
  const before = problems.length;
  try {
    await fn();
    did.push(`${problems.length === before ? "ok  " : "!!  "} ${label}`);
  } catch (error) {
    problems.push(`STUCK at "${label}": ${String(error).split("\n")[0].slice(0, 200)}`);
    did.push(`FAIL ${label}`);
  }
};

await step("sign in with a one-time code", async () => {
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.getByLabel("Mobile number").fill("+63 917 555 0182");
  await p.getByRole("button", { name: "Text me a code" }).click();
  await p.waitForURL(/\/verify$/);
  await p.getByLabel("Six-digit verification code").fill(await otp());
  await p.getByRole("button", { name: "Verify and continue" }).click();
  await p.waitForURL(/#home$/);
  await p.waitForTimeout(2200);
});

await step("see the closest reward", async () => {
  const text = await p.locator("body").innerText();
  if (!/Sweet Crumbs/i.test(text)) throw new Error("no card on the home screen");
});

await step("turn the card over for the code", async () => {
  await p.getByRole("button", { name: /member code/i }).first().click();
  await p.waitForTimeout(1200);
  const text = await p.locator("body").innerText();
  if (!/\d{4} \d{4} \d{4} \d/.test(text)) throw new Error("no grouped member code on the back");
});

await step("open the full QR screen", async () => {
  await p.getByRole("button", { name: /My QR/i }).first().click();
  await p.waitForTimeout(2000);
  const img = p.locator('img[alt*="Loyalty code"]');
  if (!(await img.count())) throw new Error("no QR image rendered");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(600);
});

await step("browse the wallet", async () => {
  await p.getByRole("button", { name: "Wallet" }).last().click();
  await p.waitForTimeout(2000);
});

await step("discover somewhere new", async () => {
  await p.getByRole("button", { name: "Discover" }).last().click();
  await p.waitForTimeout(2500);
});

await step("join a business", async () => {
  const join = p.getByRole("button", { name: /^Join/i }).first();
  if (await join.count()) {
    await join.click();
    await p.waitForTimeout(2500);
  }
});

await step("read the activity ledger", async () => {
  await p.goto(`${BASE}/#activity`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
});

await step("open notifications", async () => {
  await p.goto(`${BASE}/#notifications`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
});

await step("open the profile", async () => {
  // Notifications is a sheet over the tab bar now, so the tab is reached by
  // its hash the way the two steps above reach theirs.
  await p.goto(`${BASE}/#profile`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const heading = await p.locator("main").innerText();
  if (!/profile/i.test(heading)) throw new Error("the profile did not open");
});

await step("change a channel consent", async () => {
  const toggle = p.getByRole("switch").or(p.locator('input[type="checkbox"]')).first();
  if (await toggle.count()) {
    await toggle.click({ force: true });
    await p.waitForTimeout(2000);
  }
});

await step("walk every profile screen", async () => {
  const rows = ["Personal information", "Channel", "Privacy", "Export", "Leave", "Delete"];
  for (const row of rows) {
    const entry = p.getByText(new RegExp(row, "i")).first();
    if (await entry.count()) {
      await entry.click().catch(() => undefined);
      await p.waitForTimeout(900);
      const back = p.getByRole("button", { name: /back|close/i }).first();
      if (await back.count()) await back.click().catch(() => undefined);
      await p.waitForTimeout(500);
    }
  }
});

console.log("\n--- customer journey ---");
for (const line of did) console.log(" ", line);
console.log(`\n--- ${problems.length} problem(s) ---`);
for (const line of [...new Set(problems)]) console.log(" -", line);
await b.close();
