/**
 * A merchant's day, driven for real.
 *
 * Not a smoke test - it does the things a shop owner actually does in order,
 * and records every console error, page error and failing request along the
 * way. Anything it reports is something a real merchant would have hit.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const problems = [];
const did = [];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });

p.on("pageerror", (e) => problems.push(`PAGE ERROR: ${e.message.slice(0, 200)}`));
p.on("console", (m) => {
  if (m.type() !== "error") return;
  if (m.text().startsWith("Failed to load resource")) return;
  problems.push(`CONSOLE: ${m.text().slice(0, 200)}`);
});
p.on("response", async (r) => {
  if (!r.url().includes("/api/") || r.status() < 400) return;
  // 402 is a plan gate, an answer rather than a fault.
  if (r.status() === 402) return;
  // So is a 404 from the counter lookup: "nobody has that number" is what
  // opens the add-a-walk-in form.
  if (r.status() === 404 && new URL(r.url()).pathname.endsWith("/customers/lookup")) return;
  const body = await r.text().catch(() => "");
  problems.push(`HTTP ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname} ${body.slice(0, 160)}`);
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

await step("sign in", async () => {
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  // Typed, not assumed. The email field used to arrive holding the demo
  // owner's address, so this only ever filled the password - which meant the
  // harness signed in as whoever the form happened to be pre-filled with.
  await p.getByLabel(/email/i).first().fill("mara@sweetcrumbs.ph");
  await p.locator('input[type="password"]').fill("DemoPass123!");
  await p.getByRole("button", { name: "Continue securely" }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  await p.locator("#main-content").waitFor();
});

await step("read the dashboard", async () => {
  await p.goto(`${BASE}/#dashboard`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const text = await p.locator("#main-content").innerText();
  if (!/return rate/i.test(text)) throw new Error("no return rate panel");
});

await step("find a customer at the counter", async () => {
  await p.goto(`${BASE}/#scan`, { waitUntil: "networkidle" });
  await p.getByPlaceholder("0917 555 0182").fill("+63 917 555 0182");
  await p.getByRole("button", { name: "Find customer" }).click();
  await p.waitForTimeout(2500);
  const text = await p.locator("#main-content").innerText();
  if (!/Jacqueline/i.test(text)) throw new Error("customer not found");
});

await step("find the same customer by the printed card", async () => {
  // The flow the physical card exists for: a scanner types the number into
  // the counter's field. The lookup took only a phone number and an email, so
  // a scanned card came back "Enter a valid Philippine mobile number".
  const code = await p.evaluate(async () => {
    const r = await fetch("http://localhost:8000/api/v1/customers/lookup?phone=%2B639175550182", {
      credentials: "include",
    });
    return (await r.json()).memberCode;
  });
  if (!code) throw new Error("no member code to scan");

  // Reloaded, not navigated: the previous step left a customer on the scan
  // screen and a hash change does not clear it.
  await p.goto(`${BASE}/#scan`, { waitUntil: "networkidle" });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByPlaceholder("0917 555 0182").fill(code);
  await p.getByRole("button", { name: "Find customer" }).click();
  await p.waitForTimeout(2500);
  const text = await p.locator("#main-content").innerText();
  if (!/Jacqueline/i.test(text)) throw new Error(`card ${code} did not find the customer`);
});

await step("take a stamp", async () => {
  await p.getByLabel(/Purchase amount/i).first().fill("180");
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Approve/i }).first().click();
  await p.waitForTimeout(2500);
});

await step("undo that stamp", async () => {
  const undo = p.getByRole("button", { name: /reverse|undo/i }).first();
  if (await undo.count()) {
    await undo.click();
    await p.waitForTimeout(2000);
  }
});

await step("add a walk-in", async () => {
  // Reloaded for the same reason the card step is: the stamp before this one
  // left a customer on the scan screen, the search field is replaced while
  // one is loaded, and a hash change does not clear it. The screen has a
  // Cancel for a cashier; the harness starts clean instead.
  await p.goto(`${BASE}/#scan`, { waitUntil: "networkidle" });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByPlaceholder("0917 555 0182").fill(`0917555${String(Date.now()).slice(-4)}`);
  await p.getByRole("button", { name: "Find customer" }).click();
  await p.waitForTimeout(2000);
  const nameField = p.getByPlaceholder("Their name");
  if (await nameField.count()) {
    await nameField.fill("Test Walkin");
    const buttons = await p.locator("form button, button").allInnerTexts();
    const add = p.getByRole("button", { name: /add|create|save/i }).last();
    if (await add.count()) await add.click();
    else problems.push(`no add button among: ${buttons.join(" | ").slice(0, 200)}`);
    await p.waitForTimeout(2500);
  } else {
    throw new Error("walk-in form did not open");
  }
});

await step("browse customers", async () => {
  await p.goto(`${BASE}/#customers`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
});

await step("open a program and publish a change", async () => {
  await p.goto(`${BASE}/#programs`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.getByRole("button", { name: "Edit rules" }).click();
  await p.getByLabel("Program name").fill("Nine visits, pastry on us");
  await p.getByRole("button", { name: "Publish new version" }).click();
  await p.waitForTimeout(2000);
});

await step("read redemptions and the sales ledger", async () => {
  await p.goto(`${BASE}/#redemptions`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const text = await p.locator("#main-content").innerText();
  if (!/Recorded sales/i.test(text)) throw new Error("no sales ledger");
});

await step("refund a settled sale", async () => {
  const refund = p.getByRole("button", { name: "Refund" }).first();
  if (await refund.count()) {
    await refund.click();
    await p.waitForTimeout(2500);
  }
});

await step("read analytics", async () => {
  await p.goto(`${BASE}/#analytics`, { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
});

await step("read customer feedback", async () => {
  await p.goto(`${BASE}/#feedback`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const text = await p.locator("#main-content").innerText();
  // The seeded shop has answers; a screen that renders the empty state here
  // means the list never arrived.
  if (!/answered/i.test(text)) throw new Error("no feedback list");
  await p.getByRole("button", { name: "Unhappy" }).click();
  await p.waitForTimeout(800);
});

await step("compose a campaign", async () => {
  await p.goto(`${BASE}/#campaigns`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
});

await step("open the message log", async () => {
  await p.goto(`${BASE}/#message-log`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
});

await step("set the card colour", async () => {
  await p.goto(`${BASE}/#business`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Edit public profile" }).click();
  await p.waitForTimeout(800);
  await p.getByRole("button", { name: "Green" }).click();
  await p.waitForTimeout(1800);
  await p.keyboard.press("Escape");
});

await step("look at staff", async () => {
  await p.goto(`${BASE}/#staff`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
});

await step("look at integrations", async () => {
  await p.goto(`${BASE}/#integrations`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
});

await step("look at settings and billing", async () => {
  await p.goto(`${BASE}/#settings`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
});

await step("join code / poster", async () => {
  await p.goto(`${BASE}/#join-code`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
});

console.log("\n--- merchant journey ---");
for (const line of did) console.log(" ", line);
console.log(`\n--- ${problems.length} problem(s) ---`);
for (const line of [...new Set(problems)]) console.log(" -", line);
await b.close();
