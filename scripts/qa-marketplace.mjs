/**
 * Every page of kyp.ph, and the two doors out of it.
 *
 * The marketplace is the shopper-facing face of KYP and the only surface
 * search engines are meant to find, so a broken link here is a stranger's
 * first impression. Three checks: every route renders with a heading and no
 * console or page errors; every internal link on those pages resolves; and
 * the two doors go where they say, the wallet to app.kyp.ph and "I run a
 * shop" to kyprewards.com, never the other way round.
 *
 * The API allows thirty `/public/*` reads a minute per caller and a browser
 * walk of the site spends them fast, so the harness watches for 429s, waits
 * out `Retry-After` and runs the step again once. Link resolution fetches
 * the HTML without running the page, which costs no API reads at all.
 *
 * Needs Playwright's Chromium: `npx playwright install chromium`.
 */
import { chromium } from "playwright";

const BASE = process.env.MARKETPLACE_APP_URL ?? "http://localhost:3004";
const WALLET = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "http://localhost:3002";
const MERCHANT = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

const problems = [];
const did = [];

/** Static routes, plus one of each dynamic kind from the sample directory. */
const ROUTES = [
  "/",
  "/discover",
  "/discover?search=milk",
  "/how-it-works",
  "/for-shops",
  "/categories/Bakery",
  "/neighborhoods/Kapitolyo",
  "/shops/sweet-crumbs",
];

let b;
try {
  b = await chromium.launch();
} catch (error) {
  console.log("--- marketplace ---");
  console.log(`  skipped: Playwright's browser is not installed (${String(error).split("\n")[0]})`);
  console.log("  run: npx playwright install chromium");
  process.exit(0);
}
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });

let watching = "";
let retryAfter = 0;
p.on("response", (r) => {
  if (r.status() !== 429) return;
  retryAfter = Math.max(retryAfter, Number(r.headers()["retry-after"] ?? 30));
});
p.on("pageerror", (e) => problems.push(`PAGE ERROR ${watching}: ${e.message.slice(0, 160)}`));
p.on("console", (m) => {
  if (m.type() !== "error") return;
  const text = m.text();
  // A missing favicon is not a broken page.
  if (text.startsWith("Failed to load resource")) return;
  // The rate limiter answers before the CORS middleware, so a 429 reaches the
  // browser as a CORS refusal. The 429 itself is handled by the retry below.
  if (retryAfter && /blocked by CORS policy/.test(text)) return;
  problems.push(`CONSOLE ${watching}: ${text.slice(0, 160)}`);
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const step = async (label, fn) => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (retryAfter) {
      did.push(`     (rate limited; waiting ${retryAfter}s)`);
      await wait((retryAfter + 1) * 1000);
      retryAfter = 0;
    }
    const before = problems.length;
    watching = label;
    try {
      await fn();
      if (problems.length === before || !retryAfter) {
        did.push(`${problems.length === before ? "ok  " : "!!  "} ${label}`);
        return;
      }
    } catch (error) {
      if (!retryAfter || attempt) {
        problems.push(`STUCK at "${label}": ${String(error).split("\n")[0].slice(0, 180)}`);
        did.push(`FAIL ${label}`);
        return;
      }
    }
    // A 429 during the attempt: discard what it reported and go again once.
    problems.splice(before);
  }
};

const hrefsOn = () => p.locator("a[href]").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));

const internalLinks = new Set();
const pages = {};

// ── Every route renders ─────────────────────────────────────────────────

await step("every route renders with a heading", async () => {
  const broken = [];
  for (const route of ROUTES) {
    const response = await p.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      broken.push(`${route} -> HTTP ${status}`);
      continue;
    }
    const heading = await p.locator("h1").first().innerText().catch(() => "");
    if (!heading.trim()) broken.push(`${route} -> no h1`);

    const hrefs = await hrefsOn();
    for (const href of hrefs) if (href.startsWith("/")) internalLinks.add(href.split("#")[0]);
    pages[route] = {
      text: await p.locator("body").innerText(),
      hrefs,
      stampCards: await p.locator('[role="img"][aria-label*="stamps collected"]').count(),
    };
  }
  if (broken.length) throw new Error(broken.join("; "));
});

await step("the directory lists shops, or says why not", async () => {
  const text = pages["/discover"]?.text ?? "";
  if (!/\d+ shops?\b/.test(text) && !/no shops/i.test(text) && !/did not load/i.test(text)) {
    throw new Error("no count, no empty state and no error state on /discover");
  }
});

await step("a shop page shows the reward and the stamp card", async () => {
  const shop = pages["/shops/sweet-crumbs"];
  if (!shop) throw new Error("the shop page did not render");
  if (/did not load/i.test(shop.text)) {
    did.push("     (the shop did not load - the API is not up and preview mode is off)");
    return;
  }
  if (!shop.stampCards) throw new Error("no stamp card on the shop page");
});

await step("an unknown shop is a not-found page and noindex", async () => {
  const response = await p.goto(`${BASE}/shops/not-a-real-shop`, { waitUntil: "networkidle" });
  const text = await p.locator("body").innerText();
  if (!/no shop|not found|not here/i.test(text)) throw new Error("an unknown slug did not say so");
  const robots = await p.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
  if (!robots || !/noindex/i.test(robots)) {
    throw new Error(`unknown slug answers ${response?.status()} and is indexable: robots=${robots}`);
  }
});

// ── Every internal link resolves ────────────────────────────────────────

await step("every internal link resolves", async () => {
  const broken = [];
  for (const href of internalLinks) {
    const response = await p.request.get(`${BASE}${href}`);
    if (response.status() >= 400) broken.push(`${href} -> HTTP ${response.status()}`);
  }
  if (broken.length) throw new Error(broken.join("; "));
});

await step("sitemap and robots are served", async () => {
  for (const path of ["/sitemap.xml", "/robots.txt"]) {
    const response = await p.request.get(`${BASE}${path}`);
    if (response.status() >= 400) throw new Error(`${path} -> HTTP ${response.status()}`);
  }
  const robots = await (await p.request.get(`${BASE}/robots.txt`)).text();
  if (!/sitemap/i.test(robots)) throw new Error("robots.txt does not name the sitemap");
});

// ── The two doors ───────────────────────────────────────────────────────

await step("the two doors point at the right hosts", async () => {
  const home = pages["/"]?.hrefs ?? [];
  const wallet = home.find((h) => h.startsWith(WALLET));
  if (!wallet || !wallet.startsWith(`${WALLET}/login`)) throw new Error(`wallet door goes to ${wallet}`);
  const merchant = home.find((h) => h.startsWith(MERCHANT));
  if (!merchant) throw new Error("no merchant door on the home page");

  // Nothing on the shopper side may point at the merchant workspace or the
  // wallet's private hash routes.
  const all = Object.values(pages).flatMap((page) => page.hrefs);
  const stray = all.filter((h) => /biz\.kypstamping|admin\.kypstamping|localhost:300[01]|#scan/.test(h));
  if (stray.length) throw new Error(`stray merchant links: ${[...new Set(stray)].join(", ")}`);

  const joins = (pages["/shops/sweet-crumbs"]?.hrefs ?? []).filter((h) => /\/join\//.test(h));
  const wrong = joins.filter((h) => !h.startsWith(`${WALLET}/join/`));
  if (wrong.length) throw new Error(`join goes to ${wrong[0]}`);
});

// ── Navigation is real on both widths, and filters land in the URL ──────

await step("the header navigates, at desktop and on a phone", async () => {
  await p.goto(`${BASE}/how-it-works`, { waitUntil: "networkidle" });
  await p.getByRole("link", { name: /^for shops$/i }).first().click();
  await p.waitForURL(/\/for-shops/, { timeout: 8000 });

  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`${BASE}/for-shops`, { waitUntil: "networkidle" });
  const toggle = p.getByRole("button", { name: /navigation/i }).first();
  if (!(await toggle.count())) throw new Error("no menu control at phone width");
  await toggle.click();
  await p.waitForTimeout(400);
  const link = p.getByRole("link", { name: /^how it works$/i }).first();
  if (!(await link.isVisible())) throw new Error("the mobile menu did not open");
  await p.setViewportSize({ width: 1440, height: 1000 });
});

await step("filters land in the URL", async () => {
  await p.goto(`${BASE}/discover`, { waitUntil: "networkidle" });
  const select = p.locator('select[name="category"]');
  const options = await select.locator("option").evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
  if (!options.length) {
    did.push("     (no categories to filter by - directory is empty)");
    return;
  }
  await select.selectOption(options[0]);
  await p.waitForURL((url) => url.searchParams.get("category") === options[0], { timeout: 8000 });
});

await b.close();
console.log("--- marketplace ---");
for (const line of did) console.log(`  ${line}`);
console.log(`--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(`  ${line}`);
process.exit(problems.length ? 1 : 0);
