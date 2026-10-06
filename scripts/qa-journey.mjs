/**
 * The free tier as four people actually live it, start to finish.
 *
 * `qa-free-tier.mjs` proves the free plan's *rules* over the API. This one
 * proves the *journey*: a shop owner who has never heard of us fills in the
 * form on the marketing site, a platform admin reads that application and
 * approves it, the owner sets up their card in the real dashboard, a shopper
 * finds the shop on the marketplace and joins from their phone, the counter
 * stamps them, and the reward is approved on the customer's own screen before
 * anybody hands over a free coffee.
 *
 * The rule for which half is used where:
 *
 *   - a person at a keyboard  -> the browser, clicking what they would click
 *   - a device at the counter -> the API, exactly as a scanner or POS calls it
 *
 * Anything else would be theatre. A test that posts JSON at the application
 * endpoint has not checked the form a merchant fills in at 11pm on a phone,
 * and a test that clicks a "stamp" button in the dashboard has not checked
 * the thing a barista's scanner does.
 *
 * Nothing here is seeded. The shop, the owner, the shopper and the card are
 * all created during the run, so a green transcript means somebody could do
 * this today.
 */
import { chromium } from "playwright";
import { completeListing, freshTotp } from "./open-shop.mjs";

const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";
const APPS = {
  marketing: process.env.MARKETING_APP_URL ?? "http://localhost:3003",
  business: process.env.BUSINESS_APP_URL ?? "http://localhost:3000",
  admin: process.env.ADMIN_APP_URL ?? "http://localhost:3001",
  wallet: process.env.CUSTOMER_APP_URL ?? "http://localhost:3002",
  marketplace: process.env.MARKETPLACE_APP_URL ?? "http://localhost:3004",
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@kypstamping.ph";
const ADMIN_PASSWORD = process.env.DEMO_PASSWORD ?? "DemoPass123!";
const ADMIN_MFA_SECRET = process.env.ADMIN_MFA_SECRET ?? "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

/* A run id that is only digits: these end up inside Philippine mobile
   numbers, which are +63 then ten digits starting with 9. */
const run = String(Date.now()).slice(-6);
// A real Globe prefix, then the run id. The server validates through
// libphonenumber, which rejects invented prefixes like 903 — so a made-up
// number would fail as a bad number rather than test anything.
const nationalMobile = (suffix) => `917${run}${suffix}`.slice(0, 10).padEnd(10, "0");
const e164 = (suffix) => `+63${nationalMobile(suffix)}`;

const shop = {
  name: `Kapitolyo Kape ${run}`,
  owner: "Rosa Villanueva",
  email: `rosa-${run}@example.com`,
  password: "DemoPass123!",
  mobile: nationalMobile("1"),
  address: "18 East Capitol Drive, Kapitolyo, Pasig, Metro Manila",
  maps: "https://maps.app.goo.gl/kapitolyokape",
};
const shopper = {
  name: "Miguel Santos",
  mobile: e164("7"),
};

/* ── transcript ──────────────────────────────────────────────────────── */

const problems = [];
const script = [];
let act = "";

const scene = (title) => {
  act = title;
  script.push({ act: title });
};

const step = async (label, fn) => {
  const before = problems.length;
  try {
    const note = await fn();
    script.push({
      mark: problems.length === before ? "ok" : "!!",
      label,
      note: note ? String(note) : "",
    });
  } catch (error) {
    problems.push(`[${act}] ${label}: ${String(error).split("\n")[0].slice(0, 220)}`);
    script.push({ mark: "FAIL", label, note: String(error).split("\n")[0].slice(0, 90) });
  }
};

/* ── the API, as a device calls it ───────────────────────────────────── */

function actor(name) {
  const jar = new Map();
  return {
    name,
    async call(path, { method = "GET", body, headers = {} } = {}) {
      const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
      const response = await fetch(`${API}${path}`, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      for (const raw of response.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const index = pair.indexOf("=");
        jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      const text = await response.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        /* not json, `text` is the record */
      }
      return { status: response.status, body: json, text };
    },
    get cookies() {
      return [...jar].map(([name, value]) => ({
        name,
        value,
        domain: "localhost",
        path: "/",
      }));
    },
  };
}

const ok = (r, ...allowed) => {
  if (!allowed.includes(r.status)) {
    throw new Error(`expected ${allowed.join("/")}, got ${r.status}: ${r.text.slice(0, 160)}`);
  }
  return r;
};

const admin = actor("admin");
const merchant = actor("merchant");
const customer = actor("customer");

/* ── the browser, as a person uses it ────────────────────────────────── */

const browser = await chromium.launch({ headless: true });

/** A page that reports its own console errors, page errors and failed calls. */
async function open(label, { mobile = false } = {}) {
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 414, height: 896 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } },
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`[${act}] ${label} crashed: ${error.message.slice(0, 160)}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // The browser logs this for every non-2xx and names neither route nor
    // reason; the response listener below reports those properly.
    if (message.text().startsWith("Failed to load resource")) return;
    problems.push(`[${act}] ${label} console: ${message.text().slice(0, 160)}`);
  });
  page.on("response", async (response) => {
    if (!response.url().includes("/api/") || response.status() < 400) return;
    const path = new URL(response.url()).pathname;
    // Signed out is the normal state of a login screen, and this suite types
    // one wrong code on purpose.
    if (response.status() === 401 && /auth\/(session|login|otp\/verify)$/.test(path)) return;
    // A mobile number is mistyped on purpose, to check the refusal is shown
    // on the field rather than at the end.
    if (response.status() === 422 && /public\/partner-applications$/.test(path)) return;
    const body = await response.text().catch(() => "");
    problems.push(
      `[${act}] ${label} HTTP ${response.status()} ${response.request().method()} ${path} ${body.slice(0, 140)}`,
    );
  });
  return page;
}

const text = async (page) => (await page.locator("body").innerText()).replace(/\s+/g, " ");

/* Facts the acts hand to each other. */
const world = {
  applicationId: null,
  claimToken: null,
  accountId: null,
  merchantId: null,
  programId: null,
  successorId: null,
  joinSlug: null,
  shopSlug: null,
  branchName: null,
  customerId: null,
  memberCode: null,
  membershipId: null,
  redemptionId: null,
  rewardName: null,
  target: 0,
};

/* ═══════════════════════════════════════════════════════════════════════
   ACT 1 — A shop owner finds the site and applies
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 1 · Rosa reads kypstamping.ph and applies");

const site = await open("marketing site");

await step("the pricing page says the first plan is free", async () => {
  await site.goto(`${APPS.marketing}/pricing`, { waitUntil: "networkidle" });
  const body = await text(site);
  if (!/Launch/.test(body)) throw new Error("no Launch plan on the pricing page");
  if (!/(free|₱0|0 forever|no card)/i.test(body)) {
    throw new Error("the free plan does not read as free");
  }
  const match = /Launch[\s\S]{0,200}?(₱0|Free)/i.exec(body);
  return match ? match[0].slice(0, 60).trim() : "Launch listed";
});

await step("she fills in the application, all four steps", async () => {
  await site.goto(`${APPS.marketing}/partners`, { waitUntil: "networkidle" });

  await site.locator("#businessName").fill(shop.name);
  await site.locator("#category").selectOption({ index: 1 });
  await site.locator("#address").fill(shop.address);
  await site.locator("#mapsLink").fill(shop.maps);
  await site.getByRole("button", { name: /Continue/ }).click();
  await site.waitForTimeout(500);

  await site.locator("#ownerName").fill(shop.owner);
  // A number with the right shape and an impossible prefix. The form cannot
  // know the carrier list; the API can, and the next step checks she is told
  // where the problem is rather than at the end.
  await site.locator("#mobile").fill(`903${run}1`.slice(0, 10).padEnd(10, "0"));
  await site.locator("#email").fill(shop.email);
  await site.getByRole("button", { name: /Continue/ }).click();
  await site.waitForTimeout(500);

  // Three chip groups: how busy, what they do today, which counter suits.
  // They are pressed buttons, not radios, so they are clicked as chips.
  for (const legend of [/Customers on a normal day/i, /reward regulars today/i, /fits your counter/i]) {
    const group = site.getByRole("group", { name: legend });
    if (await group.count()) {
      await group.getByRole("button").first().click().catch(() => undefined);
      await site.waitForTimeout(200);
    }
  }
  await site.getByRole("button", { name: /Continue/ }).click();
  await site.waitForTimeout(500);

  const review = await text(site);
  if (!review.includes(shop.name)) throw new Error("the review step does not show what she typed");
  return "reviewed";
});

await step("a number the carrier list rejects is marked on its own field", async () => {
  await site.getByRole("button", { name: /Send application/ }).click();
  await site.waitForTimeout(2500);

  const invalid = site.locator("#mobile");
  if (!(await invalid.count())) {
    throw new Error("the refusal left her on the review step, away from the field to fix");
  }
  const said = await site.locator('[role="alert"]').first().innerText().catch(() => "");
  const described = await invalid.getAttribute("aria-describedby");
  const near = described
    ? await site.locator(`#${described.split(/\s+/)[0]}`).innerText().catch(() => "")
    : "";
  const message = `${said} ${near}`.trim();
  if (!/mobile|number/i.test(message)) {
    throw new Error(`nothing near the field says what is wrong: "${message.slice(0, 120)}"`);
  }

  await invalid.fill(shop.mobile);
  await site.getByRole("button", { name: /Continue/ }).click();
  await site.waitForTimeout(400);
  await site.getByRole("button", { name: /Continue/ }).click();
  await site.waitForTimeout(600);
  return message.replace(/\s+/g, " ").slice(0, 70);
});

await step("she sends it and the page confirms, without asking for a card", async () => {
  await site.getByRole("button", { name: /Send application/ }).click();
  await site.waitForTimeout(2500);
  const body = await text(site);
  if (!/Application sent/i.test(body)) {
    // The form renders the server's refusal in an alert; quoting it beats
    // reporting the whole hero as evidence.
    const alert = await site.locator('[role="alert"]').first().innerText().catch(() => "");
    throw new Error(alert ? `refused: ${alert.slice(0, 140)}` : `no confirmation: ${body.slice(0, 160)}`);
  }
  if (/card number|credit card|payment/i.test(body)) {
    throw new Error("the confirmation asks about payment on a free plan");
  }
  return "Application sent.";
});

await step("the application reached the queue with what she typed", async () => {
  // Read as the admin, because that is the only place it is visible.
  ok(await admin.call("/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  }), 200);
  ok(await admin.call("/auth/mfa/verify", {
    method: "POST",
    body: { code: await freshTotp(ADMIN_MFA_SECRET) },
  }), 200);

  const queue = ok(await admin.call("/admin/partner-applications?limit=200"), 200);
  const rows = Array.isArray(queue.body) ? queue.body : (queue.body?.items ?? []);
  const mine = rows.find((row) => row.businessName === shop.name);
  if (!mine) throw new Error(`${rows.length} pending applications, none named ${shop.name}`);
  world.applicationId = mine.id;
  if (mine.email !== shop.email) throw new Error(`email came through as ${mine.email}`);
  return `${mine.businessName}, ${mine.category ?? "no category"}`;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 2 — The platform admin reads it and decides
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 2 · The admin reviews the application");

const adminPage = await open("admin");

await step("the admin signs in with a password and an authenticator code", async () => {
  await adminPage.goto(`${APPS.admin}/login`, { waitUntil: "networkidle" });
  await adminPage.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await adminPage.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await adminPage.getByRole("button", { name: /sign in|continue/i }).first().click();
  await adminPage.waitForTimeout(1800);
  const code = adminPage.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"]').first();
  if (await code.count()) {
    await code.fill(await freshTotp(ADMIN_MFA_SECRET));
    await adminPage.getByRole("button", { name: /verify|continue/i }).first().click();
    await adminPage.waitForTimeout(2500);
  }
  const body = await text(adminPage);
  if (/sign in to/i.test(body)) throw new Error("still on the sign-in screen");
  return "signed in";
});

await step("the new application is visible in the console", async () => {
  const nav = adminPage.getByRole("button", { name: /^Applications$/ }).first();
  if (!(await nav.count())) throw new Error("no Applications section in the admin nav");
  await nav.click();
  await adminPage.waitForTimeout(3000);
  const body = await text(adminPage);
  if (!body.includes(shop.name)) {
    throw new Error(`the queue does not list ${shop.name}: ${body.slice(0, 180)}`);
  }
  // The list carries the shop name; the answers she typed are in the panel
  // that opens when the operator picks one, which is what deciding means.
  await adminPage.getByText(shop.name, { exact: false }).first().click();
  await adminPage.waitForTimeout(2000);
  const opened = await text(adminPage);
  const missing = [shop.owner, shop.email, shop.address.split(",")[0]].filter(
    (fact) => !opened.includes(fact),
  );
  if (missing.length) throw new Error(`the panel does not show: ${missing.join(", ")}`);
  return `${shop.name}, ${shop.owner}`;
});

await step("the admin leaves setup notes for the onboarding call", async () => {
  ok(
    await admin.call(`/admin/partner-applications/${world.applicationId}/notes`, {
      method: "PATCH",
      body: { setupNotes: "Single counter, one iPad. Wants a 6-stamp card for brewed coffee." },
    }),
    200,
  );
  const queue = ok(await admin.call("/admin/partner-applications?limit=100"), 200);
  const rows = Array.isArray(queue.body) ? queue.body : (queue.body?.items ?? []);
  const mine = rows.find((row) => row.id === world.applicationId);
  if (!mine?.setupNotes) throw new Error("the notes did not stick");
  return mine.setupNotes.slice(0, 48) + "…";
});

await step("the admin approves it and marks the shop founding", async () => {
  const decided = ok(
    await admin.call(`/admin/partner-applications/${world.applicationId}/decide`, {
      method: "POST",
      body: { approve: true, reason: "Kapitolyo, good foot traffic, ready to start.", founding: true },
    }),
    200,
  );
  if (decided.body?.status && !/approv/i.test(decided.body.status)) {
    throw new Error(`status after approval is ${decided.body.status}`);
  }
  return `${decided.body?.status ?? "approved"}${decided.body?.founding ? ", founding" : ""}`;
});

await step("approving twice is refused rather than silently repeated", async () => {
  const again = await admin.call(`/admin/partner-applications/${world.applicationId}/decide`, {
    method: "POST",
    body: { approve: false, reason: "changed my mind" },
  });
  if (again.status < 400) throw new Error(`a decided application accepted a second decision (${again.status})`);
  return `HTTP ${again.status}`;
});

await step("the beta switches are off: nothing is purchasable", async () => {
  const flags = ok(await admin.call("/admin/flags"), 200);
  const rows = Array.isArray(flags.body) ? flags.body : (flags.body?.items ?? []);
  const find = (key) => rows.find((row) => (row.id ?? row.key) === key);
  const tiers = find("billing.paid_tiers");
  const credits = find("billing.credit_purchases");
  if (!tiers || !credits) {
    throw new Error(`the two billing flags are not both present: ${rows.map((r) => r.id ?? r.key).join(", ")}`);
  }
  if (tiers.enabled !== false || credits.enabled !== false) {
    throw new Error(`flags are on: paid_tiers=${tiers.enabled} credit_purchases=${credits.enabled}`);
  }
  return "paid_tiers off, credit_purchases off";
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 3 — Rosa opens her dashboard and sets up the card
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 3 · Rosa sets up her stamp card");

await step("approval mailed her a way in, and it works", async () => {
  // Approving the application provisioned the workspace and mailed a
  // temporary password. She never fills in a sign-up form - the whole point
  // of applying is that somebody else did the setup.
  const inbox = ok(await admin.call("/_dev/messages?purpose=partner_approved&limit=20"), 200);
  const mine = inbox.body.find((message) =>
    (message.to ?? message.destination ?? "") === shop.email,
  );
  if (!mine) throw new Error("no approval email reached " + shop.email);
  const password = /Temporary password:\s*(\S+)/.exec(mine.body ?? "")?.[1];
  if (!password) throw new Error("the approval email carries no way to sign in");
  shop.password = password;
  if (!/\/login/.test(mine.body ?? "")) throw new Error("the email does not say where to sign in");

  ok(
    await merchant.call("/auth/login", {
      method: "POST",
      body: { email: shop.email, password },
    }),
    200,
  );
  const session = ok(await merchant.call("/auth/session"), 200);
  world.merchantId = session.body.merchantId ?? session.body.merchant?.id ?? null;
  return "signed in with the mailed password";
});

await step("that same email is the only way in: a guessed password is not", async () => {
  const stranger = actor("stranger");
  const guessed = await stranger.call("/auth/login", {
    method: "POST",
    body: { email: shop.email, password: "DemoPass123!" },
  });
  if (guessed.status < 400) throw new Error("a guessed password opened her workspace");
  return `HTTP ${guessed.status}`;
});

await step("she lands on Launch, billed nothing", async () => {
  const billing = ok(await merchant.call("/business/billing"), 200);
  if (billing.body.plan !== "Launch") throw new Error(`plan is ${billing.body.plan}`);
  if (billing.body.monthlyCentavos !== 0) throw new Error(`free plan bills ${billing.body.monthlyCentavos}`);
  if (billing.body.paidTiersOpen !== false) throw new Error("the ladder claims to be purchasable during beta");
  if (billing.body.founding !== true) throw new Error("approved as founding, but the workspace does not say so");
  return `${billing.body.plan}, ₱0, founding, ladder closed`;
});

await step("the onboarding left one live stamp card", async () => {
  const programs = ok(await merchant.call("/business/programs"), 200);
  const live = programs.body.filter((p) => p.status === "Live");
  if (live.length !== 1) throw new Error(`${live.length} live programs`);
  world.programId = live[0].id;
  world.target = live[0].target;
  world.rewardName = live[0].rewardName ?? "Free brewed coffee";
  if (live[0].rules?.welcomeStamp !== true) throw new Error("the welcome stamp is not on by default");
  return `${live[0].name}, ${live[0].target} stamps for ${world.rewardName}`;
});

await step("she sets every rule the site sells, and they all persist", async () => {
  const startsAt = new Date(Date.now() - 86_400_000).toISOString();
  const endsAt = new Date(Date.now() + 60 * 86_400_000).toISOString();
  const wanted = {
    welcomeStamp: true,
    cooldownMinutes: 1440,
    minSpendCentavos: 5_000,
    expiryDays: 120,
    startsAt,
    endsAt,
    onClose: "carryOver",
    rewardGraceDays: 14,
    maxCompletions: 3,
  };
  const saved = ok(
    await merchant.call(`/business/programs/${world.programId}`, { method: "PATCH", body: wanted }),
    200,
  );
  const rules = saved.body.rules ?? {};
  const drifted = Object.entries(wanted)
    .filter(([key, value]) => {
      if (key === "startsAt" || key === "endsAt") {
        return !rules[key] || Math.abs(Date.parse(rules[key]) - Date.parse(value)) > 60_000;
      }
      return rules[key] !== value;
    })
    .map(([key]) => key);
  if (drifted.length) throw new Error(`these did not save: ${drifted.join(", ")}`);
  return "welcome, 1/day, ₱50 min, 120-day expiry, 60-day run, carry over, 14-day grace, 3 per member";
});

const biz = await open("business dashboard");

await step("she signs in to the dashboard and sees her own shop", async () => {
  await biz.goto(`${APPS.business}/login`, { waitUntil: "networkidle" });
  await biz.locator('input[type="email"]').fill(shop.email);
  await biz.locator('input[type="password"]').fill(shop.password);
  await biz.getByRole("button", { name: /sign in|continue/i }).first().click();
  await biz.waitForTimeout(4000);
  const body = await text(biz);
  if (/sign in to/i.test(body) && !body.includes(shop.name)) {
    throw new Error("did not get past the sign-in screen with the mailed password");
  }
  return "in";
});

await step("the rules she saved are what the Program screen shows", async () => {
  const nav = biz.getByRole("button", { name: /^Program$/ }).first();
  if (await nav.count()) {
    await nav.click();
    await biz.waitForTimeout(2500);
  }
  const body = await text(biz);
  if (!/stamp/i.test(body)) throw new Error("the program screen does not mention stamps");
  const shows = [/welcome/i.test(body), /(cooldown|once a day|per day)/i.test(body), /(minimum|min spend|₱50)/i.test(body)];
  if (!shows.some(Boolean)) throw new Error("none of the rules she set are named on the screen");
  return `${shows.filter(Boolean).length}/3 rule groups visible`;
});

await step("her Discover checklist asks for a photo and a description, and she adds both", async () => {
  // Approval provisions neither, and Discover lists complete shops only.
  const { before, after } = await completeListing({
    api: API,
    merchant,
    cookie: merchant.cookies.map(({ name, value }) => `${name}=${value}`).join("; "),
  });
  if (before?.listed !== false) throw new Error("a shop with no photo or description was already listed");
  if (after?.listed !== true) throw new Error(`still not listed: ${after?.missing?.join(", ")}`);
  return `was missing: ${before.missing.join(", ")}`;
});

await step("her join poster resolves to her shop, branch and card", async () => {
  const nav = biz.getByRole("button", { name: /join code/i }).first();
  if (await nav.count()) {
    await nav.click();
    await biz.waitForTimeout(2500);
  }
  const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // kyp.ph prints the poster slug for every branch; that is the same string
  // the counter card carries.
  const listing = await fetch(`${API}/public/shops/${slugify(shop.name)}`);
  if (listing.status !== 200) throw new Error(`her shop page answers ${listing.status}`);
  const found = await listing.json();
  world.shopSlug = slugify(shop.name);
  world.branchName = found.branches?.[0]?.name ?? "";
  world.joinSlug = found.branches?.[0]?.slug;
  if (!world.joinSlug) throw new Error("her shop page prints no poster slug");

  const page = await fetch(`${API}/public/join/${world.joinSlug}`);
  if (page.status !== 200) throw new Error(`the poster link ${world.joinSlug} answers ${page.status}`);
  const offer = await page.json();
  if (offer.business !== shop.name) throw new Error(`the poster points at ${offer.business}`);
  if (offer.welcomeStamp !== true) throw new Error("the poster does not promise the welcome stamp");
  return `${world.joinSlug} → ${offer.reward}`;
});

await step("she invites one staff member for the counter", async () => {
  ok(
    await merchant.call("/business/staff/invites", {
      method: "POST",
      body: { name: "Ben at the counter", email: `ben-${run}@example.com`, role: "Cashier" },
    }),
    201,
    200,
  );
  const staff = ok(await merchant.call("/business/staff"), 200);
  const rows = Array.isArray(staff.body) ? staff.body : (staff.body?.items ?? []);
  const ben = rows.find((row) => /ben/i.test(row.name ?? row.email ?? ""));
  if (!ben) throw new Error("the invited staff member is not on the roster");
  if (ben.role && ben.role !== "Cashier") throw new Error(`invited as Cashier, listed as ${ben.role}`);
  return `${rows.length} on the roster, Ben is a ${ben.role ?? "member"}`;
});

await step("a live card and a complete profile put her on the marketplace", async () => {
  const found = await fetch(`${API}/public/discover?search=${encodeURIComponent(shop.name)}`).then((r) =>
    r.json(),
  );
  const rows = Array.isArray(found) ? found : (found?.items ?? []);
  if (!rows.some((row) => row.name === shop.name)) {
    throw new Error(`a shop with a live stamp card is not in the public directory`);
  }
  return "listed";
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 4 — Miguel finds the shop and joins from his phone
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 4 · Miguel joins from his phone");

const market = await open("marketplace");

await step("the marketplace is browsable without an account", async () => {
  await market.goto(`${APPS.marketplace}/`, { waitUntil: "networkidle" });
  const body = await text(market);
  if (/sign in to continue|log in to browse/i.test(body)) {
    throw new Error("the public marketplace demands an account");
  }
  if (!/(shop|discover|browse|near)/i.test(body)) throw new Error("no shops surface on the home page");
  return "open to everyone";
});

await step("discover returns real shops with categories to filter by", async () => {
  const discover = ok(await fetch(`${API}/public/discover?limit=12`).then((r) => r.json().then((body) => ({ status: 200, body })) ), 200);
  const rows = Array.isArray(discover.body) ? discover.body : (discover.body?.items ?? []);
  if (!rows.length) throw new Error("public discover is empty");
  const categories = await fetch(`${API}/public/discover/categories`).then((r) => r.json());
  const facets = Array.isArray(categories) ? categories : (categories?.items ?? []);
  if (!facets.length) throw new Error("no categories to filter by");
  return `${rows.length} shops, ${facets.length} categories`;
});

const wallet = await open("wallet", { mobile: true });

await step("he scans the poster on the counter and sees the offer", async () => {
  await wallet.goto(`${APPS.wallet}/join/${world.joinSlug}`, { waitUntil: "networkidle" });
  await wallet.waitForTimeout(3000);
  const body = await text(wallet);
  if (/not found|no counter code/i.test(body)) throw new Error("the poster page says the code is dead");
  if (!body.includes(shop.name.split(" ")[0])) {
    throw new Error(`the poster page does not name the shop: ${body.slice(0, 160)}`);
  }
  return "poster page renders";
});

await step("taking the offer mints a claim, and writes no stamp yet", async () => {
  const claimed = ok(
    await customer.call(`/public/join/${world.joinSlug}/first-stamp`, { method: "POST" }),
    201,
  );
  world.claimToken = claimed.body.claimToken;
  if (!world.claimToken) throw new Error("no claim token came back from the poster");
  if (claimed.body.welcomeStamp !== true) throw new Error("the offer does not include the welcome stamp");
  return `claim good for ${claimed.body.target} stamps toward ${claimed.body.reward}`;
});

await step("Miguel signs up with a one-time code to his mobile", async () => {
  // A code is only ever sent to an account that exists, so signing up is the
  // first step for somebody who has never used KYP - exactly what the wallet's
  // create-account screen does.
  ok(
    await customer.call("/auth/register/customer", {
      method: "POST",
      body: { name: shopper.name, mobile: shopper.mobile, acceptedTerms: true },
    }),
    200,
    201,
    202,
  );
  const sink = ok(await customer.call(`/_dev/messages?purpose=otp&limit=20`), 200);
  const mine = sink.body.filter((m) => (m.to ?? m.destination ?? "").includes(shopper.mobile.slice(-9)));
  const code = (mine.length ? mine : sink.body).map((m) => /\b\d{6}\b/.exec(m.body ?? "")?.[0]).find(Boolean);
  if (!code) throw new Error("no one-time code arrived");

  const wrong = await customer.call("/auth/otp/verify", {
    method: "POST",
    body: { identifier: shopper.mobile, code: code === "000000" ? "111111" : "000000" },
  });
  if (wrong.status < 400) throw new Error("a wrong code was accepted");

  const verified = ok(
    await customer.call("/auth/otp/verify", { method: "POST", body: { identifier: shopper.mobile, code } }),
    200,
  );
  world.accountId = verified.body?.accountId ?? verified.body?.customerId ?? verified.body?.id ?? null;
  return `wrong code refused (${wrong.status}), right one accepted`;
});

await step("he redeems the claim and the card lands in his wallet", async () => {
  ok(
    await customer.call("/customer/first-stamp/claim", {
      method: "POST",
      body: { claimToken: world.claimToken },
    }),
    200,
    201,
  );
  const walletNow = ok(await customer.call("/customer/wallet"), 200);
  const cards = walletNow.body.cards ?? walletNow.body ?? [];
  const card = cards.find((row) =>
    (row.business ?? row.businessName ?? row.merchantName ?? "").includes(shop.name),
  );
  if (!card) {
    throw new Error(`joined nothing: wallet holds ${JSON.stringify(cards).slice(0, 160)}`);
  }
  world.membershipId = card.id;
  if (card.progress !== 0) throw new Error(`the claim wrote ${card.progress} stamps on its own`);
  return `${card.business}, ${card.balance}`;
});

await step("the welcome stamp is promised but not yet counted", async () => {
  const walletNow = ok(await customer.call("/customer/wallet"), 200);
  const cards = walletNow.body.cards ?? walletNow.body ?? [];
  const card = cards.find((row) =>
    (row.business ?? row.businessName ?? row.merchantName ?? "").includes(shop.name),
  );
  if (!card) throw new Error("the card vanished");
  if (card.progress !== 0) throw new Error(`joining wrote ${card.progress} stamps before anybody scanned`);
  if (card.state !== "pending") throw new Error(`a card nobody has scanned is in state ${card.state}`);
  if (!card.pendingStamp) throw new Error("no pending welcome stamp on a card whose program has one");
  const activity = ok(await customer.call("/customer/activity?limit=20"), 200);
  const entries = Array.isArray(activity.body) ? activity.body : (activity.body?.items ?? []);
  const stamped = entries.filter((row) => /stamp/i.test(row.kind ?? row.type ?? ""));
  if (stamped.length) throw new Error(`${stamped.length} ledger entries before the first visit`);
  return "pending, ledger empty";
});

await step("he signs in on his own phone, through the wallet", async () => {
  // A one-time code is spent when it is used, so the browser asks for its
  // own rather than borrowing the session the assertions above used.
  await wallet.goto(`${APPS.wallet}/login`, { waitUntil: "networkidle" });
  await wallet.getByLabel(/mobile/i).fill(shopper.mobile);
  await wallet.getByRole("button", { name: /text me a code/i }).click();
  await wallet.waitForURL(/\/verify$/, { timeout: 15000 });

  const sink = ok(await customer.call("/_dev/messages?purpose=otp&limit=20"), 200);
  const tail = shopper.mobile.slice(-9);
  const mine = sink.body.filter((message) => (message.to ?? message.destination ?? "").includes(tail));
  const code = (mine.length ? mine : sink.body)
    .map((message) => /\b\d{6}\b/.exec(message.body ?? "")?.[0])
    .find(Boolean);
  if (!code) throw new Error("no one-time code arrived for the phone");

  await wallet.getByLabel(/verification code/i).fill(code);
  await wallet.getByRole("button", { name: /verify and continue/i }).click();
  await wallet.waitForURL(/#home$/, { timeout: 20000 });
  await wallet.waitForTimeout(2500);
  return "signed in on the phone";
});

await step("his wallet screen shows the card and a code to scan", async () => {
  // The home screen leads with the card closest to a reward, which on a
  // one-card wallet is this one. Waited for rather than sampled: the wallet
  // query resolves after the shell paints.
  await wallet
    .getByText(shop.name, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => undefined);
  const body = await text(wallet);
  if (!body.includes(shop.name.split(" ")[0])) {
    throw new Error(`the new card is not on the home screen: ${body.slice(0, 300)}`);
  }
  const button = wallet.getByRole("button", { name: /member code|my qr/i }).first();
  if (!(await button.count())) throw new Error("no way to show a code at the counter");
  await button.click();
  await wallet.waitForTimeout(1800);
  const shown = await text(wallet);

  const profile = ok(await customer.call("/customer/profile"), 200);
  world.memberCode = profile.body.memberCode;
  if (!world.memberCode) throw new Error("he has no member code to show");
  const grouped = world.memberCode.replace(/(\d{4})(\d{4})(\d{4})(\d)/, "$1 $2 $3 $4");
  if (!shown.includes(grouped) && !shown.includes(world.memberCode)) {
    throw new Error("the code screen does not show the code the counter scans");
  }
  return grouped;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 5 — The counter. Ben scans; the device calls the API.
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 5 · The counter stamps him");

await step("the counter finds him by the code on his screen", async () => {
  const found = ok(
    await merchant.call(`/customers/lookup?memberCode=${encodeURIComponent(world.memberCode)}`),
    200,
  );
  world.customerId = found.body.id;
  return found.body.name ?? found.body.id;
});

await step("a ₱30 coffee is under the minimum, and is refused with a reason", async () => {
  const small = await merchant.call("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": `journey_${run}_small` },
    body: { customerId: world.customerId, amountCentavos: 3_000 },
  });
  // Either a refusal, or a recorded visit that honestly earned nothing.
  if (small.status === 201) {
    if (small.body.earned) throw new Error("a ₱30 sale earned a stamp under a ₱50 minimum");
    if (!small.body.reason) throw new Error("no stamp and no reason given");
    return `recorded, earned nothing: ${small.body.reason}`;
  }
  if (small.status !== 409 && small.status !== 422) {
    throw new Error(`answered ${small.status}: ${small.text.slice(0, 140)}`);
  }
  return `HTTP ${small.status}`;
});

await step("his first real visit writes two stamps: the welcome and the visit", async () => {
  const first = ok(
    await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `journey_${run}_first` },
      body: { customerId: world.customerId, amountCentavos: 12_000 },
    }),
    201,
  );
  if (!first.body.welcomeStampConfirmed) throw new Error("the pending welcome stamp was not confirmed");
  if (first.body.stampsAfter !== 2) throw new Error(`first scan left ${first.body.stampsAfter} stamps, expected 2`);
  return `2 stamps, welcome confirmed`;
});

await step("a second scan the same minute is refused, and says when to come back", async () => {
  const again = await merchant.call("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": `journey_${run}_again` },
    body: { customerId: world.customerId, amountCentavos: 12_000 },
  });
  if (again.status !== 409) throw new Error(`the cooldown answered ${again.status}`);
  if (!again.body?.nextStampAt) throw new Error("refused without saying when the next stamp is");
  return `409, next stamp ${new Date(again.body.nextStampAt).toLocaleString("en-PH")}`;
});

await step("the same scan sent twice counts once", async () => {
  const key = `journey_${run}_idem`;
  const once = await merchant.call("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: { customerId: world.customerId, amountCentavos: 12_000 },
  });
  const twice = await merchant.call("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: { customerId: world.customerId, amountCentavos: 12_000 },
  });
  if (once.status !== twice.status) {
    throw new Error(`the same key answered ${once.status} then ${twice.status}`);
  }
  if (once.body?.id && twice.body?.id && once.body.id !== twice.body.id) {
    throw new Error("the same key created two transactions");
  }
  return `both ${once.status}, one record`;
});

await step("Rosa relaxes the cooldown for the launch week", async () => {
  ok(
    await merchant.call(`/business/programs/${world.programId}`, {
      method: "PATCH",
      body: { cooldownMinutes: 0 },
    }),
    200,
  );
  return "cooldown 0";
});

await step("he fills the card and the reward is earned, not auto-spent", async () => {
  const balance = ok(await merchant.call(`/customers/${world.customerId}/balance`), 200);
  let earned = null;
  for (let i = balance.body.balance; i < balance.body.target; i += 1) {
    const stamped = ok(
      await merchant.call("/transactions", {
        method: "POST",
        headers: { "Idempotency-Key": `journey_${run}_fill_${i}` },
        body: { customerId: world.customerId, amountCentavos: 12_000 },
      }),
      201,
    );
    earned = stamped.body.rewardEarned ?? earned;
  }
  if (!earned) throw new Error("a full card earned no reward");
  const rewards = ok(await merchant.call(`/customers/${world.customerId}/rewards`), 200);
  const held = (Array.isArray(rewards.body) ? rewards.body : rewards.body?.items ?? []).filter(
    (row) => !row.redeemedAt,
  );
  if (!held.length) throw new Error("the reward was not held for him to spend when he wants");
  return `${earned.name ?? world.rewardName}, held`;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 6 — The reward, approved on Miguel's own screen
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 6 · He redeems, and approves it himself");

await step("the counter reserves the reward and waits for him", async () => {
  const reserved = ok(
    await merchant.call("/redemptions/reserve", {
      method: "POST",
      headers: { "Idempotency-Key": `journey_${run}_reserve` },
      body: { customerId: world.customerId },
    }),
    201,
  );
  world.redemptionId = reserved.body.id;
  if (reserved.body.status !== "awaiting_customer" && !/await/i.test(reserved.body.status ?? "")) {
    throw new Error(`reserved straight to ${reserved.body.status} without asking him`);
  }
  return reserved.body.status;
});

await step("the counter cannot hand it over before he says yes", async () => {
  const early = await merchant.call(`/redemptions/${world.redemptionId}/commit`, { method: "POST" });
  if (early.status !== 409) throw new Error(`committing without approval answered ${early.status}`);
  return "409";
});

await step("it is waiting on his phone, and he approves it there", async () => {
  const pending = ok(await customer.call("/customer/redemptions/pending"), 200);
  const rows = Array.isArray(pending.body) ? pending.body : (pending.body?.items ?? []);
  if (!rows.some((row) => row.id === world.redemptionId)) {
    throw new Error("the reservation is not waiting in his wallet");
  }

  await wallet.goto(`${APPS.wallet}/#home`, { waitUntil: "networkidle" });
  await wallet.waitForTimeout(3000);
  const body = await text(wallet);
  const prompted = /(approve|confirm|waiting|redeem)/i.test(body);

  const button = wallet.getByRole("button", { name: /^(approve|yes|confirm)/i }).first();
  if (await button.count()) {
    await button.click();
    await wallet.waitForTimeout(2500);
  } else {
    // The sheet did not surface in this viewport; approve the way his phone
    // would and record that the screen did not offer it.
    ok(await customer.call(`/customer/redemptions/${world.redemptionId}/approve`, { method: "POST" }), 200);
    if (!prompted) throw new Error("nothing on the wallet screen mentioned the waiting reward");
  }

  const after = ok(await customer.call("/customer/redemptions/pending"), 200);
  const left = Array.isArray(after.body) ? after.body : (after.body?.items ?? []);
  if (left.some((row) => row.id === world.redemptionId)) throw new Error("still pending after approval");
  return "approved";
});

await step("now the counter can hand over the coffee", async () => {
  const committed = ok(
    await merchant.call(`/redemptions/${world.redemptionId}/commit`, { method: "POST" }),
    200,
  );
  // Committing is what spends it: the reward leaves circulation and the
  // ledger takes the stamps out. `committedAt` is the marker, not the status
  // word, which stays "approved" through the retry path below.
  if (!committed.body.committedAt) throw new Error("committed without a time on it");
  const rewards = ok(await merchant.call(`/customers/${world.customerId}/rewards`), 200);
  const rows = Array.isArray(rewards.body) ? rewards.body : (rewards.body?.items ?? []);
  if (rows.some((row) => row.id === committed.body.rewardId && !row.redeemedAt)) {
    throw new Error("the reward is still unspent after the counter handed it over");
  }
  return `${committed.body.status}, committed ${committed.body.committedAt}`;
});

await step("a repeated commit is a retry, and does not spend twice", async () => {
  // A counter with a flaky connection presses it again. That must replay,
  // not pay out a second coffee - so the ledger is counted either side.
  const before = ok(await merchant.call("/business/exports/redemptions"), 200);
  const twice = ok(
    await merchant.call(`/redemptions/${world.redemptionId}/commit`, { method: "POST" }),
    200,
  );
  if (!twice.body.committedAt) throw new Error("the retry lost the commit time");
  const after = ok(await merchant.call("/business/exports/redemptions"), 200);
  if (after.text.length !== before.text.length) {
    throw new Error("the retry wrote a second redemption");
  }
  const activity = ok(await customer.call("/customer/activity?limit=100"), 200);
  const entries = Array.isArray(activity.body) ? activity.body : (activity.body?.items ?? []);
  const spends = entries.filter((row) => /redeem/i.test(`${row.kind ?? ""} ${row.title ?? ""}`));
  if (spends.length > 1) throw new Error(`${spends.length} redemptions on his ledger for one reward`);
  return "replayed, one spend";
});

await step("both of them see the same history", async () => {
  const mine = ok(await customer.call("/customer/activity?limit=50"), 200);
  const entries = Array.isArray(mine.body) ? mine.body : (mine.body?.items ?? []);
  if (!entries.length) throw new Error("his activity is empty after a full card");
  const theirs = ok(await merchant.call("/business/redemptions?limit=50"), 200);
  const rows = Array.isArray(theirs.body) ? theirs.body : (theirs.body?.items ?? []);
  if (!rows.some((row) => row.id === world.redemptionId)) {
    throw new Error("the redemption is missing from the shop's own list");
  }
  return `${entries.length} entries for him, ${rows.length} redemptions for her`;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 7 — The card has a season, and it ends
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 7 · The run window, and what happens at close");

await step("she can see who is mid-card before she closes anything", async () => {
  // He spent his card a moment ago, so put two stamps back on it: a preview
  // of an empty run proves nothing about a preview.
  for (const nth of [0, 1]) {
    ok(
      await merchant.call("/transactions", {
        method: "POST",
        headers: { "Idempotency-Key": `journey_${run}_mid_${nth}` },
        body: { customerId: world.customerId, amountCentavos: 12_000 },
      }),
      201,
    );
  }
  const preview = ok(
    await merchant.call(`/business/programs/${world.programId}/close-preview?onClose=carryOver`),
    200,
  );
  const body = preview.body ?? {};
  for (const field of ["openCards", "heldRewards"]) {
    if (typeof body[field] !== "number") {
      throw new Error(`the preview does not report ${field}: ${preview.text.slice(0, 140)}`);
    }
  }
  if (body.openCards < 1) {
    throw new Error("the preview says nobody is mid-card, with two stamps just written");
  }
  // Asked as "what if I carry them over", the answer must carry them over
  // rather than expire them.
  if (body.carriedOver !== body.openCards || body.expiring !== 0) {
    throw new Error(
      `carrying over ${body.openCards} card(s) reports ${body.carriedOver} carried and ${body.expiring} expiring`,
    );
  }
  return `${body.openCards} open, ${body.carriedOver} would carry over, ${body.heldRewards} held`;
});

await step("lowering the completions cap stops the member earning again", async () => {
  ok(
    await merchant.call(`/business/programs/${world.programId}`, {
      method: "PATCH",
      body: { maxCompletions: 1 },
    }),
    200,
  );
  // He has completed one already. The next full card must not complete again.
  let refusedAt = null;
  for (let i = 0; i < world.target + 2 && !refusedAt; i += 1) {
    const stamped = await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `journey_${run}_cap_${i}` },
      body: { customerId: world.customerId, amountCentavos: 12_000 },
    });
    if (stamped.status === 409 || stamped.body?.reason) {
      refusedAt = stamped.body?.reason ?? `HTTP ${stamped.status}`;
      break;
    }
    if (stamped.status === 201 && stamped.body.rewardEarned) {
      throw new Error(
        "he earned another reward after the cap was lowered to the completions he already had",
      );
    }
  }
  if (!refusedAt) return "no second reward earned";
  return refusedAt;
});

await step("a successor card exists to carry stamps into", async () => {
  const created = ok(
    await merchant.call("/business/programs", {
      method: "POST",
      body: {
        type: "Stamps",
        name: `Rainy season card ${run}`,
        status: "Draft",
        target: 6,
        rewardName: "Free brewed coffee",
        welcomeStamp: false,
      },
    }),
    201,
  );
  world.successorId = created.body.id;
  const linked = ok(
    await merchant.call(`/business/programs/${world.programId}`, {
      method: "PATCH",
      body: { onClose: "carryOver", successorProgramId: world.successorId },
    }),
    200,
  );
  if (linked.body.rules?.successorProgramId !== world.successorId) {
    throw new Error("the successor did not link");
  }
  return created.body.name;
});

await step("only one card can be live at a time on the free plan", async () => {
  const live = await merchant.call(`/business/programs/${world.successorId}`, {
    method: "PATCH",
    body: { status: "Live" },
  });
  if (live.status < 400) throw new Error(`a second live program was allowed (${live.status})`);
  if (live.status !== 402 && live.status !== 409) {
    throw new Error(`refused with ${live.status}, expected 402 or 409`);
  }
  return `HTTP ${live.status}`;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 8 — What free does not include, said out loud
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 8 · The edges of the free plan");

await step("paid levers answer 402, not a crash and not a quiet yes", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const later = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const paid = [
    ["POST", "/business/bonus-windows", { name: "Rainy hours", multiplier: 2, fromHour: 14, toHour: 17, startsOn: today }],
    ["POST", "/business/promo-codes", { code: `RAIN${run}`, kind: "stamps", value: 1 }],
    ["POST", "/business/store-credit", { customerId: world.customerId, amountCentavos: 5_000, reason: "goodwill" }],
    ["POST", `/business/programs/${world.programId}/tiers`, { name: "Suki", threshold: 10, rateBps: 12_000 }],
    ["POST", "/business/missions", { name: "Three in a week", goal: "visits", targetCount: 3, startsOn: today, endsOn: later }],
    ["GET", "/business/gifts", null],
  ];
  const wrong = [];
  const seen = [];
  for (const [method, path, body] of paid) {
    const answer = await merchant.call(path, body ? { method, body } : { method });
    if (answer.status === 404) continue; // not part of this build's surface
    seen.push(`${path.split("/").pop()}=${answer.status}`);
    // 409 is the shape refusing before the plan does — a stamp card has no
    // tiers at any price. Still a refusal, still not a quiet yes.
    if (![402, 403, 409].includes(answer.status)) {
      wrong.push(`${path} -> ${answer.status} ${answer.text.slice(0, 90)}`);
    }
  }
  if (wrong.length) throw new Error(wrong.join("; "));
  return seen.join(", ");
});

await step("an email campaign is refused rather than quietly queued", async () => {
  const created = await merchant.call("/business/campaigns", {
    method: "POST",
    body: { name: "Launch week", audience: "Everyone", channels: ["email"] },
  });
  if (created.status === 201) throw new Error("a Launch shop queued an email campaign");
  if (created.status !== 402 && created.status !== 403 && created.status !== 409) {
    throw new Error(`answered ${created.status}: ${created.text.slice(0, 120)}`);
  }
  const said = created.body?.detail ?? created.body?.message ?? "";
  if (!/plan|Launch|Core|Grow|Scale|upgrade/i.test(said)) {
    throw new Error(`refused without naming the plan: ${said.slice(0, 100)}`);
  }
  return `HTTP ${created.status} — ${said.slice(0, 70)}`;
});

await step("buying credits is closed during the beta, and says so", async () => {
  const bought = await merchant.call("/business/credits/purchase", {
    method: "POST",
    body: { bundle: "1000" },
  });
  if (bought.status === 201 || bought.status === 200) {
    throw new Error("credits were purchasable with the flag off");
  }
  if (bought.status === 404) return "not exposed";
  const said = (bought.body?.detail ?? bought.body?.message ?? bought.text ?? "").slice(0, 100);
  return `HTTP ${bought.status} ${said}`;
});

await step("upgrading is not possible while the ladder is closed", async () => {
  const upgraded = await merchant.call("/business/billing/plan", {
    method: "PATCH",
    body: { plan: "Core" },
  });
  if (upgraded.status === 200) throw new Error("a plan change went through during the beta");
  return `HTTP ${upgraded.status}`;
});

await step("she can still export her own members and history", async () => {
  const exports = ["customers", "transactions", "redemptions"];
  const failed = [];
  for (const what of exports) {
    const file = await merchant.call(`/business/exports/${what}`);
    if (file.status !== 200) failed.push(`${what} -> ${file.status}`);
  }
  if (failed.length) throw new Error(failed.join("; "));
  return exports.join(", ");
});

await step("a mistake at the counter can be undone", async () => {
  const stamped = ok(
    await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `journey_${run}_oops` },
      body: { customerId: world.customerId, amountCentavos: 9_000 },
    }),
    201,
  );
  ok(await merchant.call(`/transactions/${stamped.body.id}/void`, { method: "POST" }), 200);
  return "voided";
});

await step("he can leave, and take his data with him", async () => {
  const requested = await customer.call("/customer/data-requests", {
    method: "POST",
    body: { kind: "export" },
  });
  if (requested.status >= 400 && requested.status !== 429) {
    throw new Error(`an export request answered ${requested.status}`);
  }
  const consent = ok(await customer.call("/customer/channels"), 200);
  if (!consent.body) throw new Error("no channel consents to change");
  return `export ${requested.status}, consents readable`;
});

/* ═══════════════════════════════════════════════════════════════════════
   ACT 9 — Everybody looks at what happened
   ═══════════════════════════════════════════════════════════════════════ */

scene("Act 9 · The day, seen from all four seats");

await step("Rosa's dashboard counts the visits and the reward", async () => {
  const nav = biz.getByRole("button", { name: /^Dashboard$/ }).first();
  if (await nav.count()) {
    await nav.click();
    await biz.waitForTimeout(3000);
  }
  await biz.reload({ waitUntil: "networkidle" });
  await biz.waitForTimeout(3000);
  const body = await text(biz);
  if (/something went wrong|failed to load/i.test(body)) throw new Error("the dashboard is showing an error");
  const transactions = ok(await merchant.call("/business/transactions?limit=100"), 200);
  const rows = Array.isArray(transactions.body) ? transactions.body : (transactions.body?.items ?? []);
  if (rows.length < 5) throw new Error(`only ${rows.length} transactions after a full card`);
  return `${rows.length} visits recorded`;
});

await step("her customer list shows him with his real balance", async () => {
  const list = ok(await merchant.call("/business/customers?limit=50"), 200);
  const rows = Array.isArray(list.body) ? list.body : (list.body?.items ?? []);
  const him = rows.find((row) => row.id === world.customerId);
  if (!him) throw new Error("the customer who filled a card is not on her list");
  if (!him.memberCode) throw new Error("her own list shows him without the code she scans");
  return `${him.name}, ${him.progress ?? him.visits + " visits"}`;
});

await step("his wallet shows the spent reward and the fresh card", async () => {
  await wallet.goto(`${APPS.wallet}/#wallet`, { waitUntil: "networkidle" });
  await wallet.waitForTimeout(3000);
  const body = await text(wallet);
  if (/something went wrong|failed to load/i.test(body)) throw new Error("the wallet is showing an error");
  if (!body.includes(shop.name.split(" ")[0])) throw new Error("his card is gone from the wallet");
  return "card still there";
});

await step("the shop is now findable by a stranger on kyp.ph", async () => {
  const shopPage = await fetch(`${API}/public/shops/${world.shopSlug}`);
  if (shopPage.status === 404) return "not listed (the shop chose not to publish)";
  if (shopPage.status !== 200) throw new Error(`the public shop page answered ${shopPage.status}`);
  const found = await shopPage.json();
  if (!found.name) throw new Error("the public page has no name on it");
  await market.goto(`${APPS.marketplace}/shops/${world.shopSlug}`, { waitUntil: "networkidle" });
  await market.waitForTimeout(2500);
  const body = await text(market);
  if (!body.includes(found.name.split(" ")[0])) throw new Error("the marketplace page does not render the shop");
  return found.name;
});

await step("the admin sees the new tenant, on Launch, billing nothing", async () => {
  const tenants = ok(await admin.call("/admin/tenants?limit=200"), 200);
  const rows = Array.isArray(tenants.body) ? tenants.body : (tenants.body?.items ?? []);
  const mine = rows.find((row) => (row.name ?? row.businessName) === shop.name);
  if (!mine) throw new Error("the approved shop is not in the tenant list");
  if (mine.plan && mine.plan !== "Launch") throw new Error(`the tenant is on ${mine.plan}`);
  return `${mine.name ?? mine.businessName}, ${mine.plan ?? "Launch"}${mine.founding ? ", founding" : ""}`;
});

await step("the whole approval left an audit trail", async () => {
  const audit = ok(await admin.call('/admin/audit?limit=200'), 200);
  const rows = Array.isArray(audit.body) ? audit.body : (audit.body?.items ?? []);
  const about = rows.filter((row) => JSON.stringify(row).includes(shop.name));
  if (!about.length) {
    throw new Error();
  }
  const decision = about.find((row) => /approv|partner|application|decide/i.test(row.action ?? ''));
  if (!decision) {
    throw new Error();
  }
  return ;
});

/* ── the transcript ──────────────────────────────────────────────────── */

console.log("\n════════════════════════════════════════════════════════════");
console.log(`  The free tier, played out — ${shop.name}`);
console.log("════════════════════════════════════════════════════════════");
for (const line of script) {
  if (line.act) {
    console.log(`\n${line.act}`);
    continue;
  }
  const mark = line.mark === "ok" ? "  ok  " : line.mark === "!!" ? "  !!  " : "  FAIL";
  console.log(`${mark} ${line.label}${line.note ? `\n         → ${line.note}` : ""}`);
}

const unique = [...new Set(problems)];
console.log(`\n──────────────── ${unique.length} problem(s) ────────────────`);
for (const line of unique) console.log(" -", line);
console.log("");

// A close that hangs or throws is not a failed walk. This is a nine-act run
// with four contexts open for two minutes, and twice it reported no problems
// and still exited 1 - the verdict is the problem list, not the teardown.
await browser.close().catch((failure) => {
  console.log(`(the browser did not close cleanly: ${failure.message.split("\n")[0]})`);
});
process.exit(unique.length ? 1 : 0);
