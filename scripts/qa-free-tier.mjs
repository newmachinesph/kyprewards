/**
 * The free tier, end to end, on a shop that did not exist a minute ago.
 *
 * Every other harness runs against the seeded demo merchant, which is on Grow
 * and already has eight programs, forty transactions and a wallet full of
 * customers. None of them can tell you whether somebody who signs up today,
 * pays nothing, and follows the onboarding gets a working loyalty program -
 * which is the only journey the product currently sells.
 *
 * So this one opens a real business the only way one opens - an application
 * the admin approves - keeps it on Launch, and then asks three questions:
 *
 *   1. Can it do everything the free plan promises?
 *   2. Is it refused everything the free plan excludes, with 402 rather than
 *      a crash or a silent success?
 *   3. Do all four frontends render for it - including the customer's wallet,
 *      which is the half a merchant never sees and cannot report?
 *
 * The customer side uses a real account through the real one-time-code flow,
 * because "the customer can join" is the claim the whole free tier rests on.
 */
import { chromium } from "playwright";
import { completeListing, openApprovedShop, signInAdmin } from "./open-shop.mjs";

const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";
const APPS = {
  business: process.env.BUSINESS_APP_URL ?? "http://localhost:3000",
  admin: process.env.ADMIN_APP_URL ?? "http://localhost:3001",
  customer: process.env.CUSTOMER_APP_URL ?? "http://localhost:3002",
  marketing: process.env.MARKETING_APP_URL ?? "http://localhost:3003",
};

const problems = [];
const did = [];
// Digits only: these become Philippine mobile numbers, which are +63 followed
// by ten digits starting with 9. A base-36 run id put letters in them and the
// API refused all twenty, correctly.
const run = String(Date.now()).slice(-6);
// A real Globe prefix, then enough of the run id to stay unique.
//
// Numbers used to be built as `+639` plus the run id, which is a slice of the
// clock - so whenever the timestamp happened to end in digits that are not a
// Philippine mobile prefix (anything starting 0, say) every enrolment came
// back 422 and the whole suite failed on the time of day rather than on the
// product.
const mobile = (suffix) => `+63917${run.slice(-5)}${suffix}`;

const step = async (label, fn) => {
  const before = problems.length;
  try {
    const note = await fn();
    const mark = problems.length === before ? "ok  " : "!!  ";
    did.push(`${mark} ${label}${note ? ` — ${note}` : ""}`);
  } catch (error) {
    problems.push(`STUCK at "${label}": ${String(error).split("\n")[0].slice(0, 200)}`);
    did.push(`FAIL ${label}`);
  }
};

/* ── A cookie jar per actor, so the merchant and the customer are
      genuinely different sessions rather than one that keeps re-signing-in. */
function actor() {
  const jar = new Map();
  return {
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
        /* not json; `text` is the record */
      }
      return { status: response.status, body: json, text };
    },
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
  };
}

const admin = actor();
const merchant = actor();
const customer = actor();
const shop = {
  email: `free-${run}@example.com`,
  password: "DemoPass123!",
  name: `Free Tier Cafe ${run}`,
};
let merchantId = null;
let customerId = null;
let memberCode = null;
let programId = null;

const ok = (r, ...allowed) => {
  if (!allowed.includes(r.status)) {
    throw new Error(`expected ${allowed.join("/")}, got ${r.status}: ${r.text.slice(0, 140)}`);
  }
  return r;
};

/* ── 1. A shop that did not exist a minute ago ───────────────────────── */

await step("apply, get approved, and sign in with the mailed password", async () => {
  // There is no sign-up: a shop exists because its application was approved.
  await signInAdmin(admin);
  // The browser half signs in later with the password approval mailed.
  ({ merchantId, password: shop.password } = await openApprovedShop({
    admin,
    merchant,
    name: shop.name,
    email: shop.email,
    ownerName: "Free Owner",
  }));
  if (!merchantId) throw new Error("no merchant id came back");
  return merchantId;
});

await step("the new shop is on the free plan", async () => {
  const billing = ok(await merchant.call("/business/billing"), 200);
  if (billing.body.plan !== "Launch") throw new Error(`plan is ${billing.body.plan}`);
  if (billing.body.monthlyCentavos !== 0) {
    throw new Error(`free plan bills ${billing.body.monthlyCentavos} centavos`);
  }
  // No members allowance: customers are unlimited, so there is nothing to meter.
  const metered = billing.body.allowances.map((row) => row.label);
  if (metered.some((label) => /member|customer/i.test(label))) {
    throw new Error(`free plan still meters customers: ${metered.join(", ")}`);
  }
  return metered.join(", ");
});

/* ── 2. Everything the free plan promises ────────────────────────────── */

await step("the onboarding left a live stamp card", async () => {
  const programs = ok(await merchant.call("/business/programs"), 200);
  const live = programs.body.filter((p) => p.status === "Live");
  if (live.length !== 1) throw new Error(`${live.length} live programs, expected 1`);
  if (live[0].type !== "Stamps") throw new Error(`live program is ${live[0].type}`);
  programId = live[0].id;
  if (!live[0].rules || live[0].rules.welcomeStamp !== true) {
    throw new Error("a new stamp card should carry its rules with the welcome stamp on");
  }
  return `${live[0].name}, ${live[0].target} stamps`;
});

await step("unlimited customers: add twenty and none is refused", async () => {
  for (let i = 0; i < 20; i += 1) {
    const created = await merchant.call("/customers", {
      method: "POST",
      body: { name: `Regular ${i}`, mobile: mobile(String(i).padStart(2, "0")) },
    });
    if (created.status === 402) throw new Error(`refused customer ${i + 1} on a plan with no cap`);
    ok(created, 201);
    if (i === 0) {
      customerId = created.body.id;
      memberCode = created.body.memberCode;
    }
  }
  const list = ok(await merchant.call("/business/customers?limit=50"), 200);
  return `${list.body.length} on the roster`;
});

await step("a member code is issued and is scannable", async () => {
  if (!memberCode) throw new Error("no member code on the first customer");
  const found = ok(
    await merchant.call(`/customers/lookup?memberCode=${encodeURIComponent(memberCode)}`),
    200,
  );
  if (found.body.id !== customerId) throw new Error("the code found somebody else");
  return memberCode;
});

await step("the cooldown refuses a second stamp in the same day, with the next time", async () => {
  const first = ok(
    await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `free_${run}_cool_1` },
      body: { customerId, amountCentavos: 12_000 },
    }),
    201,
  );
  const second = await merchant.call("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": `free_${run}_cool_2` },
    body: { customerId, amountCentavos: 12_000 },
  });
  if (second.status !== 409 || !second.body?.nextStampAt) {
    throw new Error(`a second stamp inside the cooldown answered ${second.status} without nextStampAt`);
  }
  // The shop sets its own cooldown; this suite fills a card in one sitting.
  ok(
    await merchant.call(`/business/programs/${programId}`, {
      method: "PATCH",
      body: { cooldownMinutes: 0 },
    }),
    200,
  );
  return `stamp ${first.body.stampsAfter}, then 409 until ${second.body.nextStampAt}`;
});

await step("stamp the card to its target and earn the reward", async () => {
  const balance = ok(await merchant.call(`/customers/${customerId}/balance`), 200);
  let reward = null;
  for (let i = balance.body.balance; i < balance.body.target; i += 1) {
    const stamped = ok(
      await merchant.call("/transactions", {
        method: "POST",
        headers: { "Idempotency-Key": `free_${run}_${i}` },
        body: { customerId, amountCentavos: 12_000 },
      }),
      201,
    );
    reward = stamped.body.rewardEarned ?? reward;
  }
  if (!reward) throw new Error("filling the card earned no reward");
  return reward.name;
});

await step("redeem the reward at the counter", async () => {
  const reserved = ok(
    await merchant.call("/redemptions/reserve", {
      method: "POST",
      headers: { "Idempotency-Key": `free_${run}_reserve` },
      body: { customerId },
    }),
    201,
  );
  // The reward waits for the customer's approval on their phone. The first
  // regular is signed in with a real one-time code to give it.
  const regular = actor();
  const identifier = mobile("00");
  ok(await regular.call("/auth/otp/request", { method: "POST", body: { identifier } }), 200);
  const sent = ok(await regular.call("/_dev/messages?purpose=otp&limit=1"), 200);
  const code = sent.body[0]?.body?.match(/\d{6}/)?.[0];
  if (!code) throw new Error("no one-time code reached the dev sink for the regular");
  ok(await regular.call("/auth/otp/verify", { method: "POST", body: { identifier, code } }), 200);
  const pending = ok(await regular.call("/customer/redemptions/pending"), 200);
  if (!pending.body.some((row) => row.id === reserved.body.id)) {
    throw new Error("the reservation is not waiting in the customer's wallet");
  }
  ok(
    await regular.call(`/customer/redemptions/${reserved.body.id}/approve`, { method: "POST" }),
    200,
  );
  ok(await merchant.call(`/redemptions/${reserved.body.id}/commit`, { method: "POST" }), 200);
  return reserved.body.rewardName;
});

await step("a mistaken stamp can be reversed", async () => {
  const stamped = ok(
    await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `free_${run}_oops` },
      body: { customerId, amountCentavos: 9_000 },
    }),
    201,
  );
  ok(await merchant.call(`/transactions/${stamped.body.id}/void`, { method: "POST" }), 200);
});

await step("email campaigns are not on the free plan, and say so", async () => {
  // The pricing page carries no email allowance on Launch since the channels
  // were re-priced; the only honest answer to an email campaign here is a
  // refusal that names the plan, never a quiet queue.
  const created = await merchant.call("/business/campaigns", {
    method: "POST",
    body: {
      name: `Free tier hello ${run}`,
      audience: "Everyone",
      channels: ["Email"],
      sendTime: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
  if (![402, 409].includes(created.status)) {
    throw new Error(`the free plan has no email allowance but answered ${created.status}`);
  }

  const billing = ok(await merchant.call("/business/billing"), 200);
  const email = billing.body.allowances.find((row) => row.label === "Email");
  if (email && email.included > 0) {
    throw new Error(`email allowance is ${email.included} on a plan that sells none`);
  }
  return `HTTP ${created.status}, no email allowance`;
});

await step("SMS is not included, and says so rather than sending", async () => {
  const refused = await merchant.call("/business/campaigns", {
    method: "POST",
    body: {
      name: `Free tier SMS ${run}`,
      audience: "Everyone",
      channels: ["SMS"],
      sendTime: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
  if (refused.status < 400) throw new Error("a free shop scheduled an SMS campaign");
  if (!/allowance|credit|sms/i.test(refused.text)) {
    throw new Error(`refusal does not mention the allowance: ${refused.text.slice(0, 120)}`);
  }
  return `HTTP ${refused.status}`;
});

await step("the member list exports, on the free plan too", async () => {
  const csv = ok(await merchant.call("/business/exports/customers"), 200);
  const lines = csv.text.trim().split("\n");
  if (lines.length < 21) throw new Error(`export has ${lines.length - 1} rows, expected 20+`);
  return `${lines.length - 1} rows`;
});

/* ── 3. Everything the free plan excludes ────────────────────────────── */

const GATED = [
  ["gift cards", "/gift-cards", { amountCentavos: 50_000 }],
  ["coupons", "/coupons", { name: "C", valueCentavos: 100 }],
  ["memberships", "/memberships/subscribe", { customerId: "x", programId: "x" }],
  ["multipass", "/multipass/purchase", { customerId: "x", programId: "x" }],
  ["approvals", "/approvals", { action: "a", target: "b" }],
  ["offline queue", "/counter/offline-sync", { entries: [] }],
  ["referrals", "/referrals", { customerId: "x" }],
];

await step("every paid feature answers 402, not a crash or a quiet yes", async () => {
  const wrong = [];
  for (const [name, path, body] of GATED) {
    const response = await merchant.call(path, { method: "POST", body });
    if (response.status !== 402) {
      wrong.push(`${name} -> ${response.status}`);
    } else if (!/plan/i.test(response.text)) {
      wrong.push(`${name} -> 402 but does not name a plan`);
    }
  }
  if (wrong.length) throw new Error(wrong.join("; "));
  return `${GATED.length} checked`;
});

await step("a paid program type can be drafted but not switched on", async () => {
  const draft = ok(
    await merchant.call("/business/programs", {
      method: "POST",
      body: { name: `Points ${run}`, type: "Points" },
    }),
    201,
  );
  const live = await merchant.call(`/business/programs/${draft.body.id}`, {
    method: "PATCH",
    body: { status: "Live" },
  });
  if (live.status !== 402) {
    throw new Error(
      live.status < 400
        ? "a free shop switched on a Points program"
        : `refused with ${live.status}; a plan gate is 402 so the UI can offer an upgrade`,
    );
  }
  return "402 with an upgrade prompt";
});

await step("a second live program is refused: one at a time on free", async () => {
  const second = await merchant.call("/business/programs", {
    method: "POST",
    body: { name: "Second card", type: "Stamps", target: 8, rewardName: "Another" },
  });
  if (second.status === 402) return "402 at creation";
  ok(second, 201);
  const live = await merchant.call(`/business/programs/${second.body.id}`, {
    method: "PATCH",
    body: { status: "Live" },
  });
  if (live.status < 400) throw new Error("a free shop switched on a second live program");
  return `HTTP ${live.status} when switching it live`;
});

/* ── 4. The customer half ────────────────────────────────────────────── */

await step("a customer signs in with a real one-time code", async () => {
  const walletMobile = mobile("99");
  ok(
    await customer.call("/auth/register/customer", {
      method: "POST",
      body: { name: "Free Tier Customer", mobile: walletMobile, city: "Pasig", acceptedTerms: true },
    }),
    200,
    201,
    202,
  );
  ok(
    await customer.call("/auth/otp/request", {
      method: "POST",
      body: { identifier: walletMobile },
    }),
    200,
  );

  const sent = ok(await customer.call("/_dev/messages?purpose=otp&limit=1"), 200);
  const code = sent.body[0]?.body?.match(/\d{6}/)?.[0];
  if (!code) throw new Error("no one-time code was sent");
  ok(
    await customer.call("/auth/otp/verify", {
      method: "POST",
      body: { identifier: walletMobile, code },
    }),
    200,
  );
  return walletMobile;
});

await step("Discover waits for a photo and a description, then lists the shop", async () => {
  const { before, after } = await completeListing({ api: API, merchant, cookie: merchant.cookie });
  if (before?.listed !== false) throw new Error("a shop with no photo or description was already listed");
  if (!before.missing.includes("A cover photo")) {
    throw new Error(`the checklist did not ask for a photo: ${before.missing.join(", ")}`);
  }
  if (after?.listed !== true) throw new Error(`still not listed: ${after?.missing?.join(", ")}`);
  return `was missing ${before.missing.length}, now listed`;
});

await step("the free shop is findable in Discover and joinable", async () => {
  const discover = ok(await customer.call("/customer/discover"), 200);
  const mine = discover.body.find((b) => b.id === `discover_${merchantId}`);
  if (!mine) throw new Error("a free-plan shop is not listed in Discover");
  ok(await customer.call(`/customer/discover/${merchantId}/join`, { method: "POST" }), 200, 201);

  // Matched on the shop's name: a wallet card carries `businessId`, which is
  // the merchant's public `biz_...` identifier rather than the `mrc_...` one
  // the join was addressed to.
  const wallet = ok(await customer.call("/customer/wallet"), 200);
  const card = wallet.body.find((c) => c.business === shop.name);
  if (!card) {
    throw new Error(
      `joining built no card. Wallet holds: ${wallet.body.map((c) => c.business).join(", ") || "nothing"}`,
    );
  }
  return `${mine.name} joined`;
});

/* ── 5. All four frontends, for this shop ────────────────────────────── */

const browser = await chromium.launch();

const watch = (page, where) => {
  page.on("pageerror", (e) => problems.push(`PAGE ERROR ${where}: ${e.message.slice(0, 140)}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (m.text().startsWith("Failed to load resource")) return;
    problems.push(`CONSOLE ${where}: ${m.text().slice(0, 140)}`);
  });
};

await step("business workspace renders for the free shop", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(page, "business");
  await page.goto(`${APPS.business}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).first().fill(shop.email);
  await page.locator('input[type="password"]').fill(shop.password);
  await page.getByRole("button", { name: /continue|sign in/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
  await page.locator("#main-content").waitFor();

  const seen = [];
  for (const view of ["dashboard", "scan", "customers", "program", "billing"]) {
    await page.goto(`${APPS.business}/#${view}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const text = await page.locator("#main-content").innerText();
    if (text.trim().length < 40) throw new Error(`#${view} rendered nothing`);
    seen.push(view);
  }
  await page.close();
  return seen.join(", ");
});

await step("the customer wallet renders the free shop's card", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(page, "customer");
  await page.context().addCookies(
    customer.cookie.split("; ").filter(Boolean).map((pair) => {
      const index = pair.indexOf("=");
      return {
        name: pair.slice(0, index),
        value: pair.slice(index + 1),
        domain: "localhost",
        path: "/",
      };
    }),
  );
  // The Wallet tab lists every card by shop; Home shows the nearest reward.
  await page.goto(`${APPS.customer}/#wallet`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const text = await page.locator("body").innerText();
  if (!text.includes(shop.name)) {
    throw new Error(`the wallet does not show ${shop.name}`);
  }
  await page.close();
  return "card visible";
});

await step("the platform admin can see the new shop", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(page, "admin");
  await page.goto(`${APPS.admin}/login`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  if (text.trim().length < 40) throw new Error("the admin sign-in rendered nothing");
  await page.close();
  return "sign-in renders";
});

await step("the marketing site sells what this shop actually got", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(page, "marketing");
  await page.goto(`${APPS.marketing}/pricing`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  if (!/unlimited customers/i.test(text)) throw new Error("no unlimited-customers claim");
  const cap = text.match(/\b(250|1,?500|10,?000|50,?000)\s*(active\s*)?(members|customers)/i);
  if (cap) throw new Error(`still advertises a cap: ${cap[0]}`);
  await page.close();
  return "consistent with the plan we just used";
});

await browser.close();

console.log("--- free tier, end to end ---");
for (const line of did) console.log(`  ${line}`);
console.log(`--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(`  ${line}`);
process.exit(problems.length ? 1 : 0);
