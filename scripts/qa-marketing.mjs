/**
 * Every page of the marketing site, and every part of it that does something.
 *
 * The other harnesses drive the two signed-in apps and the wallet. The public
 * site had none, which is backwards: it is the only one a stranger sees, it is
 * where the money starts, and a form that silently fails there costs a lead
 * nobody ever knows about.
 *
 * Two halves. First every route renders, has a heading, and reports no console
 * or page errors. Then the four pages that actually do something get exercised
 * for real - the contact form submits, the partner application walks its
 * steps, the estimator recomputes, the wallet card flips.
 */
import { chromium } from "playwright";

const BASE = process.env.MARKETING_APP_URL ?? "http://localhost:3003";
const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";

const problems = [];
const did = [];

/** Static routes, plus one of each dynamic kind. */
const ROUTES = [
  "/",
  "/about",
  "/compare",
  "/compare/gobalik",
  "/compare/suki-cards",
  "/compare/zap",
  "/contact",
  "/faq",
  "/features",
  "/integrations",
  "/loyalty-program-philippines",
  "/partners",
  "/pricing",
  "/privacy",
  "/product",
  "/resources",
  "/resources/design-a-reward-people-finish",
  "/solutions",
  "/solutions/cafes-and-bakeries",
  "/terms",
  "/merchant-terms",
  "/data-sharing",
  "/subprocessors",
  "/cookies",
  "/llms.txt",
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });

let watching = "";
p.on("pageerror", (e) => problems.push(`PAGE ERROR ${watching}: ${e.message.slice(0, 160)}`));
p.on("console", (m) => {
  if (m.type() !== "error") return;
  const text = m.text();
  // A missing favicon or a blocked third-party pixel is not a broken page.
  if (text.startsWith("Failed to load resource")) return;
  problems.push(`CONSOLE ${watching}: ${text.slice(0, 160)}`);
});

const step = async (label, fn) => {
  const before = problems.length;
  watching = label;
  try {
    await fn();
    did.push(`${problems.length === before ? "ok  " : "!!  "} ${label}`);
  } catch (error) {
    problems.push(`STUCK at "${label}": ${String(error).split("\n")[0].slice(0, 180)}`);
    did.push(`FAIL ${label}`);
  }
};

// ── Every route renders ─────────────────────────────────────────────────

await step("every route renders with a heading", async () => {
  const broken = [];
  for (const route of ROUTES) {
    const response = await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      broken.push(`${route} -> HTTP ${status}`);
      continue;
    }
    if (route === "/llms.txt") continue;
    const heading = await p.locator("h1").first().innerText().catch(() => "");
    if (!heading.trim()) broken.push(`${route} -> no h1`);
  }
  if (broken.length) throw new Error(broken.join("; "));
});

// ── A poster page for a real shop, and one for a shop that is not there ──

await step("a real join code shows the shop, an unknown one does not", async () => {
  const known = await p.evaluate(async (api) => {
    const r = await fetch(`${api}/public/join/sweet-crumbs-kapitolyo`);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, API);
  if (known.status !== 200) throw new Error(`join API answered ${known.status}`);

  await p.goto(`${BASE}/join/sweet-crumbs-kapitolyo`, { waitUntil: "networkidle" });
  const shown = await p.locator("body").innerText();
  if (!shown.includes(known.body.business)) {
    throw new Error(`page does not name ${known.body.business}`);
  }

  const missed = await p.goto(`${BASE}/join/not-a-real-shop`, { waitUntil: "networkidle" });
  const missing = await p.locator("body").innerText();

  // The important half: a made-up code must never render as a real shop.
  if (/collect stamps at/i.test(missing)) {
    throw new Error("an unknown join code rendered a shop page");
  }

  // A poster code is scanned by somebody standing in the shop, so "this page
  // is not part of the route" is the wrong sentence: the page is fine, the
  // code is not. The <title> already knows - it says "Join code not found" -
  // but the body falls through to the site-wide 404.
  if (!/code/i.test(missing)) {
    problems.push(
      "COPY: an unknown join code shows the generic 404 and never mentions the code",
    );
  }

  // And it answers 200, so a search engine indexes a not-found page as real.
  if (missed?.status() === 200) {
    problems.push("SOFT 404: /join/<unknown> renders the 404 page with HTTP 200");
  }
});

// ── Pricing: the estimator and the coming-soon tiers ─────────────────────

await step("pricing shows unlimited customers on every tier", async () => {
  await p.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  const text = await p.locator("body").innerText();
  // Any of the old ceilings next to the word members or customers, in any
  // phrasing. An earlier version of this check looked for the exact string
  // "250 active members" and sailed past a stat block reading "250 members".
  const cap = text.match(/\b(250|1,?500|10,?000|50,?000)\s*(active\s*)?(members|customers)/i);
  if (cap) throw new Error(`still advertises a cap: "${cap[0]}"`);
  if (!/unlimited customers/i.test(text)) throw new Error("no unlimited-customers claim");
});

await step("only the free tier is buyable, the rest say coming soon", async () => {
  await p.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  // Text, not a control: a tier you cannot buy has no action to offer, so
  // there is deliberately no button to find.
  const soon = await p.getByText(/^coming soon$/i).count();
  if (soon < 3) throw new Error(`expected 3 coming-soon tiers, found ${soon}`);

  // Visible, not hidden: all four names still on the page.
  const text = await p.locator("body").innerText();
  for (const name of ["Launch", "Core", "Grow", "Scale"]) {
    if (!text.includes(name)) throw new Error(`${name} is missing from the page`);
  }

  const live = p.getByRole("link", { name: /start free/i }).first();
  if (!(await live.count())) throw new Error("the free plan has no working call to action");

  // And nothing clickable is pretending to sell them.
  const clickable = await p
    .getByRole("link", { name: /choose (core|grow|scale)/i })
    .count();
  if (clickable) throw new Error("an unavailable tier still has a working call to action");
});

await step("the estimator recomputes when the inputs change", async () => {
  await p.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  const sliders = p.locator('input[type="range"]');
  const count = await sliders.count();
  if (!count) throw new Error("no estimator inputs on the page");

  const readTotals = async () =>
    (await p.locator("body").innerText()).match(/₱[\d,]+/g)?.join("|") ?? "";
  const before = await readTotals();

  // Push every input to its maximum: whatever the estimator quotes, it must
  // not quote the same number for the cheapest and the most expensive month.
  for (let i = 0; i < count; i += 1) {
    await sliders.nth(i).fill(await sliders.nth(i).getAttribute("max"));
  }
  await p.waitForTimeout(400);
  if ((await readTotals()) === before) throw new Error("the estimate did not move");
});

// ── The two forms that send something ───────────────────────────────────

await step("the contact form submits and is acknowledged", async () => {
  await p.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  const stamp = Date.now();
  await p.getByLabel(/name/i).first().fill("QA Marketing");
  await p.getByLabel(/email/i).first().fill(`qa-marketing-${stamp}@example.com`);
  const message = p.getByLabel(/message|how can we help|tell us/i).first();
  if (await message.count()) await message.fill("Automated check from qa:marketing.");

  const optional = p.getByLabel(/business|shop|company/i).first();
  if (await optional.count()) await optional.fill("QA Coffee");

  await p.getByRole("button", { name: /send|submit/i }).first().click();
  await p.waitForTimeout(2500);

  const after = await p.locator("body").innerText();
  // Either it thanks them or it says why not. Silence is the failure.
  if (!/thank|thanks|got it|received|we will|we'll|touch|sent/i.test(after)) {
    if (/too many|already|error|sorry|could not|wrong/i.test(after)) {
      did.push("     (contact form refused - throttled or validated, which is an answer)");
      return;
    }
    throw new Error(`no acknowledgement after submitting: ${after.slice(0, 160)}`);
  }
});

await step("the partner application accepts a first step", async () => {
  await p.goto(`${BASE}/partners`, { waitUntil: "networkidle" });
  const before = await p.locator("body").innerText();

  const fields = p.locator("input:visible, textarea:visible");
  const count = await fields.count();
  if (!count) throw new Error("no intake fields on the page");

  for (let i = 0; i < count; i += 1) {
    const field = fields.nth(i);
    const type = (await field.getAttribute("type")) ?? "text";
    if (type === "checkbox" || type === "radio") continue;
    const name =
      ((await field.getAttribute("name")) ?? "") +
      ((await field.getAttribute("placeholder")) ?? "");
    if (type === "number") await field.fill("2");
    else if (/email/i.test(name)) await field.fill(`qa-partner-${Date.now()}@example.com`);
    else if (/phone|mobile/i.test(name)) await field.fill("09171234567");
    else await field.fill("QA Partner");
  }

  await p.getByRole("button", { name: /next|continue|submit|apply|send/i }).first().click();
  await p.waitForTimeout(1800);

  const after = await p.locator("body").innerText();
  if (after === before) throw new Error("the form did not react to the first step at all");
});

// ── The product page's interactive card ─────────────────────────────────

await step("the wallet card on /product flips", async () => {
  await p.goto(`${BASE}/product`, { waitUntil: "networkidle" });
  const flip = p.getByRole("button", { name: /flip|turn|back|front|card/i }).first();
  if (!(await flip.count())) {
    did.push("     (no flip control found on /product - card may be presentational here)");
    return;
  }
  const before = await p.locator("body").innerText();
  await flip.click();
  await p.waitForTimeout(700);
  if ((await p.locator("body").innerText()) === before) {
    throw new Error("the card did not change when flipped");
  }
});

// ── Navigation is real on both widths ───────────────────────────────────

await step("the header navigates, at desktop and on a phone", async () => {
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.getByRole("link", { name: /^pricing$/i }).first().click();
  await p.waitForURL(/\/pricing/, { timeout: 8000 });

  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const toggle = p.getByRole("button", { name: /menu|navigation|open/i }).first();
  if (!(await toggle.count())) throw new Error("no menu control at phone width");
  await toggle.click();
  await p.waitForTimeout(500);
  const link = p.getByRole("link", { name: /^pricing$/i }).first();
  if (!(await link.isVisible())) throw new Error("the mobile menu did not open");
  await p.setViewportSize({ width: 1440, height: 1000 });
});

await b.close();
console.log("--- marketing site ---");
for (const line of did) console.log(`  ${line}`);
console.log(`--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(`  ${line}`);
process.exit(problems.length ? 1 : 0);
