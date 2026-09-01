/**
 * What the merchant sees when the API says no.
 *
 * The other harnesses walk the happy paths and treat any 4xx as a fault. This
 * one goes looking for refusals on purpose, because a refusal the interface
 * swallows is worse than a crash: the cashier is standing at the till being
 * told nothing, and the most likely thing they do next is press the button
 * again.
 *
 * Every case here is a refusal the API is right to send. The only question is
 * whether the screen says so.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const API = "http://localhost:8000/api/v1";
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

/** Text on screen that a person would read as "that did not work".
 *
 * Reads the whole page, not `#main-content`. The toast renders outside it, so
 * scoping to the main region reported every refusal as silent - which is how
 * this harness first accused the counter of swallowing an error it was in
 * fact showing. */
const saysSomethingFailed = async () => {
  const text = await p.locator("body").innerText();
  return /(cannot|could not|couldn.t|failed|not enough|only |already|no longer|invalid|not a valid|not valid|expired|too many|refused|unable|left on|sorry|error|try again|nobody found)/i.test(
    text,
  );
};

await step("sign in", async () => {
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.locator('input[type="password"]').fill("DemoPass123!");
  await p.getByRole("button", { name: "Continue securely" }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  await p.locator("#main-content").waitFor();
});

// A gift card with a known, small balance, so "spend more than is on it" is
// a refusal the API is certain to send.
let code = null;
await step("issue a gift card to overspend", async () => {
  const issued = await p.evaluate(async (api) => {
    const r = await fetch(`${api}/gift-cards`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCentavos: 10000 }),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, API);
  if (issued.status !== 201) throw new Error(`could not issue: ${issued.status}`);
  code = issued.body.code;
});

await step("the till is told a gift card has not got that much on it", async () => {
  await p.goto(`${BASE}/#counter`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  const field = p.locator('input').filter({ hasNot: p.locator('[type="password"]') });
  const count = await field.count();
  let filled = false;
  for (let i = 0; i < count; i += 1) {
    const placeholder = (await field.nth(i).getAttribute("placeholder")) ?? "";
    const name = (await field.nth(i).getAttribute("name")) ?? "";
    if (/gift|card|code/i.test(placeholder + name)) {
      await field.nth(i).fill(code);
      filled = true;
      break;
    }
  }
  if (!filled) {
    did.push("     (no gift-card field on the counter screen; checked via the API instead)");
    const refused = await p.evaluate(
      async ([api, c]) => {
        const r = await fetch(`${api}/gift-cards/${c}/redeem`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountCentavos: 9999999 }),
        });
        return { status: r.status, body: await r.text() };
      },
      [API, code],
    );
    if (refused.status !== 409) throw new Error(`expected 409, got ${refused.status}`);
    if (!/left on that card/i.test(refused.body)) {
      throw new Error(`refusal does not say what is wrong: ${refused.body.slice(0, 120)}`);
    }
  }
});

// The one that matters most: a stamp the API refuses. A member code with a
// good check digit that belongs to nobody is a 404 the cashier must see,
// because the next thing they do is decide whether to re-scan or go looking
// for the customer.
await step("a misread card says so, rather than naming the wrong field", async () => {
  await p.goto(`${BASE}/#scan`, { waitUntil: "networkidle" });
  // Thirteen digits with a broken check digit: what a scanner produces when
  // it misreads one. The cashier has to be told to scan again, not told to
  // enter a mobile number while holding a card.
  await p.getByPlaceholder("0917 555 0182").fill("2900000000006");
  await p.getByRole("button", { name: "Find customer" }).click();
  // Read while the toast is still up: it dismisses itself, and waiting long
  // enough for the network then reports every message as never shown.
  await p.waitForTimeout(900);

  const shown = await p.locator("body").innerText();
  if (/valid Philippine mobile/i.test(shown)) {
    problems.push("MISLEADING: a scanned card was answered as a bad phone number");
  }

  if (!(await saysSomethingFailed())) {
    const shown = (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200);
    problems.push(`SILENT: an unknown card left the counter saying nothing. Screen reads: ${shown}`);
  }
});

await step("a refused program change says why", async () => {
  const refused = await p.evaluate(async (api) => {
    const r = await fetch(`${api}/business/programs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bad", type: "Stamps", target: 999 }),
    });
    return { status: r.status, body: await r.text() };
  }, API);
  if (refused.status < 400) throw new Error(`expected a refusal, got ${refused.status}`);
  if (!/target|between|1|30/i.test(refused.body)) {
    throw new Error(`refusal names no field: ${refused.body.slice(0, 140)}`);
  }
});

await b.close();
console.log("--- refusals ---");
for (const line of did) console.log(`  ${line}`);
console.log(`--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(`  ${line}`);
process.exit(problems.length ? 1 : 0);
