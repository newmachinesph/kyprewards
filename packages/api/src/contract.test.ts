/**
 * Contract tests: every accessor, against the running API.
 *
 * These exist because the alternative — generating types from the OpenAPI
 * schema — proves only that the frontend agrees with what the server *says*
 * it returns. It cannot catch a handler whose response model and behaviour
 * have drifted apart, and it cannot catch a field that is declared but always
 * null. These call the real service and assert on the real body.
 *
 * Every assertion below is one the fixture would fail. That is deliberate:
 * a test both sources pass proves nothing about which one answered.
 *
 * Needs the stack up (`make up` in backend/). Skips with a clear message
 * rather than failing when it is not, so `npm test` still works on a laptop
 * with no Docker.
 */

import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac } from "node:crypto";
import { before, describe, test } from "node:test";

import { ApiError, fieldErrors } from "./http.ts";

const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";
process.env.NEXT_PUBLIC_API_BASE = API;

const OWNER = { email: "mara@sweetcrumbs.ph", password: "DemoPass123!" };
const ADMIN = { email: "admin@kypstamping.ph", password: "DemoPass123!" };
// Fixed in scripts/seed.py so the local admin TOTP is reproducible.
const ADMIN_MFA_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
// The email rather than the mobile: OTP requests are throttled per
// destination (3 per 10 minutes), and leaving the mobile alone means a manual
// curl against the running stack does not lock the suite out.
const CUSTOMER_EMAIL = "jacqueline.daniel@example.com";
// The write tests stamp a real card, and this suite shares its database with
// the backend's. cus_1001 is the one the shared scenario narrates and that
// 34 backend assertions pin, so the writes go to the customer nobody else
// asserts on - and void themselves afterwards.
const SCRATCH_CUSTOMER = "cus_1008";

/**
 * Probed at module load, with top-level await, because `test()`'s `skip`
 * option is evaluated while the test tree is being built — long before any
 * `before` hook runs. Setting it from a hook left every test skipped with
 * "API not reachable" against a perfectly healthy stack.
 */
const reachable: boolean = await fetch(`${API}/health`)
  .then((response) => response.ok)
  .catch(() => false);

if (!reachable) {
  console.warn(`\n  contract tests skipped: no API at ${API}. Start it with:`);
  console.warn("    cd backend && make up\n");
}

/* ── A cookie jar per test ────────────────────────────────────────────
   The session is an httpOnly cookie. A browser carries it automatically and
   `http()` relies on that, so the jar is patched in around global fetch -
   which also means the accessors run exactly as shipped, with no test seam.

   It is scoped with AsyncLocalStorage rather than held in one variable
   because node:test runs these concurrently. A single jar let one test's
   sign-in land in another's request mid-flight, and the symptom was a 401 on
   a request that was perfectly well formed. Each test now gets its own. */

const jar = new AsyncLocalStorage<{ cookie: string }>();
const realFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const store = jar.getStore();
  const headers = new Headers(init.headers);
  if (store?.cookie) headers.set("cookie", store.cookie);
  const response = await realFetch(input, { ...init, headers });
  for (const raw of response.headers.getSetCookie()) {
    if (store) store.cookie = raw.split(";")[0];
  }
  return response;
};

/** RFC 6238, six digits, 30-second step. Twenty lines beats a dependency. */
function totp(secret: string, at = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replace(/=+$/, "")) {
    bits += alphabet.indexOf(character.toUpperCase()).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)),
  );

  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));

  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(code % 1_000_000).padStart(6, "0");
}

/**
 * The check digit the counter relies on, computed independently here.
 *
 * Deliberately not imported from anywhere the API shares: a checksum verified
 * with the same function that produced it verifies nothing.
 */
function isEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const total = [...code.slice(0, 12)].reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1),
    0,
  );
  return Number(code[12]) === (10 - (total % 10)) % 10;
}

async function post(path: string, body: unknown) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // A response body can only be read once, and a template literal evaluates
  // its parts whether the assertion passes or not - so building the failure
  // message inline consumed the body before `json()` could have it.
  if (!response.ok) {
    assert.fail(`${path} answered ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

/** Undoes a stamp this suite made, so the card is left where it was found. */
async function voidVisit(transactionId: string) {
  await post(`/transactions/${transactionId}/void`, { reason: "contract test" });
}

/**
 * One session per persona, established once.
 *
 * Signing in inside each test was correct but unaffordable: the API throttles
 * `/auth/*` per caller and OTP codes to three per destination per ten
 * minutes, so twenty-three tests produced nineteen 429s. A session lasts
 * twelve hours; three logins is all this file needs.
 */
const sessions: Record<Persona, string> = { owner: "", admin: "", customer: "" };

/**
 * Why a persona could not sign in, if it could not.
 *
 * Held per persona rather than thrown, because a throwing `before` cancels
 * every test in the file. A throttled OTP should fail the four wallet tests
 * and tell you why - not hide the state of the other nineteen.
 */
const signInFailures: Record<Persona, string | null> = {
  owner: null,
  admin: null,
  customer: null,
};

type Persona = "owner" | "admin" | "customer";

/** Runs a sign-in in its own jar and returns the cookie it ended up with. */
async function establish(signIn: () => Promise<void>): Promise<string> {
  const store = { cookie: "" };
  await jar.run(store, signIn);
  return store.cookie;
}

async function signInOwner() {
  await post("/auth/login", OWNER);
}

async function signInAdmin() {
  await post("/auth/login", ADMIN);
  await post("/auth/mfa/verify", { code: totp(ADMIN_MFA_SECRET) });
}

async function signInCustomer() {
  const requested = await fetch(`${API}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: CUSTOMER_EMAIL }),
  });
  if (requested.status === 429) {
    // Three codes per destination per ten minutes, by design. Running this
    // suite in a tight loop trips it, and without saying so the failure reads
    // like a broken endpoint.
    assert.fail(
      "OTP throttled: three codes per ten minutes per destination. " +
        "Wait, or point KYP_TEST_API at a fresh stack.",
    );
  }
  assert.ok(requested.ok, `otp/request answered ${requested.status}`);

  const sent = await (await fetch(`${API}/_dev/messages?purpose=otp&limit=1`)).json();
  const code = /\d{6}/.exec(sent[0].body)?.[0];
  assert.ok(code, "no OTP reached the dev sink");
  await post("/auth/otp/verify", { identifier: CUSTOMER_EMAIL, code });
}

before(async () => {
  if (!reachable) return;
  const personas: [Persona, () => Promise<void>][] = [
    ["owner", signInOwner],
    ["admin", signInAdmin],
    ["customer", signInCustomer],
  ];
  for (const [who, signIn] of personas) {
    try {
      sessions[who] = await establish(signIn);
    } catch (failure) {
      signInFailures[who] = failure instanceof Error ? failure.message : String(failure);
    }
  }
});

/**
 * Which session the next `live()` registrations use. Each suite sets it as
 * its first statement, which runs while the test tree is being built.
 */
let persona: Persona = "owner";

/**
 * One test, signed in before it runs.
 *
 * The sign-in is inside the test rather than in a `before` hook because all
 * four suites share one cookie jar — `http()` uses the global fetch, exactly
 * as a browser does — and logging in as a second persona revokes the first
 * session. Whether node:test interleaves the suites is then not something
 * this file has to depend on, and a local login costs milliseconds.
 */
const live = (name: string, body: () => Promise<void>) => {
  // Captured at registration, not at run time: by the time a body runs, every
  // suite has been registered and `persona` holds whichever came last.
  const who = persona;
  test(name, { skip: !reachable && "API not reachable" }, () => {
    const failure = signInFailures[who];
    if (failure) assert.fail(`could not sign in as ${who}: ${failure}`);
    // A fresh store seeded with that persona's cookie, so a request in one
    // test can never pick up the session another test is using.
    return jar.run({ cookie: sessions[who] }, body);
  });
};

const isIso = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

/** Money crosses the wire as an integer count of centavos, never a float. */
const isCentavos = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value);

describe("business workspace", () => {
  let api: typeof import("./endpoints.ts");
  persona = "owner";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("the profile carries one ISO renewal date, not a display twin", async () => {
    const profile = await api.getBusinessProfile();

    assert.equal(profile.name, "Sweet Crumbs Bakery");
    assert.match(profile.renewalOn, /^\d{4}-\d{2}-\d{2}$/);
    // The fixture carried `renewal: "15 September 2026"` alongside
    // `renewalIso`. Two fields for one fact is how they drift apart.
    assert.equal("renewal" in profile, false);
    assert.equal("renewalIso" in profile, false);
  });

  live("customers report money in centavos and time as an instant", async () => {
    const customers = await api.getBusinessCustomers();

    assert.ok(customers.length > 0);
    const [first] = customers;
    assert.ok(isCentavos(first.lifetimeValueCentavos), "lifetimeValueCentavos");
    assert.ok(isIso(first.lastVisitAt), `lastVisitAt was ${first.lastVisitAt}`);
    // "Today, 9:42 AM" ages into a lie; the API never sends display copy.
    assert.equal("lastVisit" in first, false);
    assert.equal("lifetimeValue" in first, false);
  });

  live("the sales ledger names a settled transaction, in centavos", async () => {
    const transactions = await api.getTransactions(20);

    assert.ok(Array.isArray(transactions));
    if (transactions.length === 0) return;
    const [first] = transactions;
    assert.ok(isCentavos(first.amountCentavos), "amountCentavos");
    assert.ok(isIso(first.occurredAt), `occurredAt was ${first.occurredAt}`);
    // The screen's Refund button keys off this exact vocabulary.
    assert.ok(["recorded", "voided", "refunded"].includes(first.status), first.status);
    // Newest first: the ledger is read from the top.
    const stamps = transactions.map((row) => row.occurredAt);
    assert.deepEqual(stamps, [...stamps].sort().reverse());
  });

  live("a gift card reads back as a statement, not just a balance", async () => {
    // Issued here rather than read from the seed: there is no list route, so
    // the only stable way to have a code is to make one.
    const issued = await api.issueGiftCard({
      amountCentavos: 50_000,
      issuedToName: "Contract test",
    });

    const card = await api.getGiftCard(issued.code);
    assert.equal(card.code, issued.code);
    assert.ok(isCentavos(card.balanceCentavos), "balanceCentavos");
    assert.ok(isCentavos(card.initialCentavos), "initialCentavos");

    // The counter shows the last few movements before charging the card.
    const entries = await api.getGiftCardEntries(card.code);
    assert.ok(Array.isArray(entries));
    for (const entry of entries) {
      assert.ok(isCentavos(entry.amountCentavos), "amountCentavos");
      assert.ok(isCentavos(entry.balanceAfterCentavos), "balanceAfterCentavos");
      assert.ok(isIso(entry.occurredAt), `occurredAt was ${entry.occurredAt}`);
    }
  });

  live("a program without a visit target is patchable without one", async () => {
    const programs = await api.getPrograms();
    // Coupon, Gift card, Membership and Discount all carry target 0. The
    // editor used to seed its draft from that and send it back, and the API
    // refuses anything below 1 - so publishing any of them failed on a field
    // the merchant never touched.
    const targetless = programs.find((program) => program.target === 0);
    if (!targetless) return;

    const renamed = await api.updateProgram(targetless.id, { name: targetless.name });
    assert.equal(renamed.id, targetless.id);
    assert.equal(renamed.name, targetless.name);
  });

  live("the analytics the paid tiers promise all answer", async () => {
    const [segments, staff, branches, campaigns] = await Promise.all([
      api.getSegments(),
      api.getStaffPerformance(),
      api.getBranchPerformance(),
      api.getCampaignAttribution(),
    ]);

    // Four reads that were written, tested and rendered by no screen, so the
    // pricing page promised them and the product never showed them.
    assert.ok(segments.length > 0, "no segments");
    assert.ok(
      Math.abs(segments.reduce((sum, row) => sum + row.share, 0) - 100) < 1.5,
      "segment shares should account for the whole tenant",
    );
    for (const member of staff) assert.ok(isCentavos(member.valueCentavos), "staff value");
    for (const branch of branches) assert.ok(isCentavos(branch.valueCentavos), "branch value");

    for (const campaign of campaigns) {
      assert.equal(campaign.basis, "attributed");
      assert.ok(isCentavos(campaign.revenueCentavos), "campaign revenue");
      // Null when the send cost nothing. This was typed `number`, and the
      // first screen to render it crashed on `.toFixed` of a free in-app send.
      assert.ok(
        campaign.returnOnSpend === null || typeof campaign.returnOnSpend === "number",
        `returnOnSpend was ${campaign.returnOnSpend}`,
      );
      if (campaign.costCentavos === 0) assert.equal(campaign.returnOnSpend, null);
    }
  });

  live("the customer segment union is closed", async () => {
    const segments = new Set(
      (await api.getBusinessCustomers()).map((customer) => customer.segment),
    );

    const allowed = new Set([
      "VIP",
      "Regular",
      "Almost regular",
      "New",
      "At risk",
      "Lapsed",
      "Reward ready",
    ]);
    for (const segment of segments) {
      assert.ok(allowed.has(segment), `unexpected segment ${segment}`);
    }
  });

  live("programs report reward liability in centavos", async () => {
    const programs = await api.getPrograms();

    assert.ok(programs.length > 0);
    for (const program of programs) {
      assert.ok(isCentavos(program.liabilityCentavos), program.id);
    }
  });

  live("a points program answers with its earning ladder", async () => {
    const programs = await api.getPrograms();
    const points = programs.find((program) => program.type === "Points");
    assert.ok(points, "the seed runs a points program");

    const tiers = await api.getTiers(points.id);

    assert.ok(tiers.length > 0, "a points program is seeded with tiers");
    // Basis points, not a float multiplier: 10000 is 1x. A tier that arrived
    // as 1.5 would silently earn a member 1.5 points per peso instead of 15000.
    for (const tier of tiers) {
      assert.ok(Number.isInteger(tier.rateBps), `${tier.id} rate ${tier.rateBps}`);
      assert.ok(Number.isInteger(tier.threshold), `${tier.id} threshold`);
      assert.ok(tier.name.length > 0);
    }
    assert.deepEqual(
      tiers.map((tier) => tier.threshold),
      [...tiers.map((tier) => tier.threshold)].sort((left, right) => left - right),
      "the ladder arrives in threshold order, so the UI can render it as read",
    );
  });

  live("a stamp card refuses a tier rather than storing an unreachable one", async () => {
    const programs = await api.getPrograms();
    const stamps = programs.find((program) => program.type === "Stamps");
    assert.ok(stamps, "the seed runs a stamp card");

    // Only points and discount programs read a ladder. Writing one onto a
    // stamp card would be accepted config that nothing ever applies.
    const refused = await api
      .addTier(stamps.id, { name: "Contract", threshold: 5, rateBps: 15000 })
      .then(() => null)
      .catch((error: unknown) => error);

    assert.ok(refused instanceof ApiError, "expected an ApiError");
    assert.equal(refused.status, 409);
    assert.deepEqual(await api.getTiers(stamps.id), [], "and nothing was written");
  });

  live("metrics are centavos", async () => {
    const metrics = await api.getBusinessMetrics();

    assert.ok(isCentavos(metrics.averageOrderCentavos));
    assert.ok(isCentavos(metrics.memberRevenueCentavos));
    assert.ok(isCentavos(metrics.campaignRevenueCentavos));
  });

  live("billing states the next invoice as a date", async () => {
    const billing = await api.getBilling();

    assert.ok(isCentavos(billing.monthlyCentavos));
    assert.match(billing.nextInvoiceOn, /^\d{4}-\d{2}-\d{2}$/);
  });

  live("staff, redemptions and messages carry instants", async () => {
    const [staff, redemptions, messages] = await Promise.all([
      api.getStaff(),
      api.getRedemptions(),
      api.getMessages(),
    ]);

    // Null is a documented answer: a member who was invited and has never
    // signed in has no last-active instant. Asserting on staff[0] passed only
    // while the roster happened to hold no pending invitation.
    assert.ok(staff.length > 0, "no staff to check");
    for (const member of staff) {
      assert.ok(
        member.lastActiveAt === null || isIso(member.lastActiveAt),
        `lastActiveAt was ${member.lastActiveAt}`,
      );
    }
    assert.ok(
      staff.some((member) => isIso(member.lastActiveAt)),
      "no staff member has ever been active",
    );
    assert.ok(isIso(redemptions[0].occurredAt));
    assert.ok(isCentavos(redemptions[0].valueCentavos));
    assert.ok(isIso(messages[0].sentAt));
    assert.ok(isCentavos(messages[0].costCentavos));
  });

  live("locations, automations, campaigns and integrations answer", async () => {
    const [locations, automations, campaigns, integrations, favorites] = await Promise.all([
      api.getLocations(),
      api.getAutomations(),
      api.getCampaigns(),
      api.getIntegrations(),
      api.getFavoriteOrders(),
    ]);

    assert.ok(locations.length > 0 && locations[0].hours.length > 0);
    assert.ok(isCentavos(automations[0].revenueCentavos));
    assert.ok(isCentavos(campaigns[0].revenueCentavos));
    assert.ok(isCentavos(campaigns[0].costCentavos));
    assert.ok(integrations.length > 0);
    assert.ok(favorites.length > 0);
  });

  live("the contract describes this API, not a placeholder", async () => {
    const contract = await api.getContract();

    assert.equal(contract.amountUnit, "centavos");
    assert.equal(contract.currency, "PHP");
    assert.equal(contract.idempotency.header, "Idempotency-Key");
  });
});

describe("customer wallet", () => {
  let api: typeof import("./endpoints.ts");
  persona = "customer";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("a wallet card is a membership and never reads negative", async () => {
    const wallet = await api.getWallet();

    assert.ok(wallet.length > 0);
    for (const card of wallet) {
      // The fixture used "wallet_1"; a real card is the membership itself.
      assert.match(card.id, /^mem_/);
      assert.ok(card.progress >= 0, `progress was ${card.progress}`);
      assert.ok(!card.balance.startsWith("-"), card.balance);
    }
  });

  live("activity and notifications carry instants, not display copy", async () => {
    const [activity, notifications] = await Promise.all([
      api.getActivity(),
      api.getNotifications(),
    ]);

    assert.ok(isIso(activity[0].occurredAt));
    assert.equal("date" in activity[0], false);
    assert.ok(isIso(notifications[0].receivedAt));
    assert.equal("time" in notifications[0], false);
  });

  live("the profile carries the scannable member code", async () => {
    const profile = await api.getCustomerProfile();

    // The customer's one identity across every business they join, and the
    // number printed on a physical card. Thirteen digits with a valid EAN-13
    // check digit - it was `KYP-` plus the primary key until the card became
    // something you can hold.
    assert.match(profile.memberCode, /^\d{13}$/);
    assert.ok(isEan13(profile.memberCode), profile.memberCode);
  });

  live("discover and consent history answer", async () => {
    const [discover, consent] = await Promise.all([
      api.getDiscover(),
      api.getConsentHistory(),
    ]);

    assert.ok(discover.length > 0);
    assert.ok(isIso(consent[0].occurredAt));
  });
});

describe("platform administration", () => {
  let api: typeof import("./endpoints.ts");
  persona = "admin";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("tenant revenue is centavos and the join date is a date", async () => {
    const tenants = await api.getTenants();

    assert.ok(tenants.length > 0);
    assert.ok(isCentavos(tenants[0].mrrCentavos));
    assert.match(tenants[0].joinedOn, /^\d{4}-\d{2}-\d{2}$/);
  });

  live("platform metrics are centavos", async () => {
    const metrics = await api.getPlatformMetrics();

    assert.ok(isCentavos(metrics.monthlyRecurringRevenueCentavos));
    assert.ok(isCentavos(metrics.smsLiabilityCentavos));
  });

  live("the support queue and audit ledger carry instants", async () => {
    const [support, audit] = await Promise.all([
      api.getSupportQueue(),
      api.getAuditLedger(),
    ]);

    // The fixture stored "14 minutes" and an ageMinutes twin; an age is
    // derived from an instant, not stored beside one.
    assert.ok(isIso(support[0].openedAt));
    assert.ok(isIso(audit[0].occurredAt));
  });

  live("platform flags answer with the switches the console renders", async () => {
    const flags = await api.getPlatformFlags();

    assert.ok(flags.length > 0, "no flags to render");
    // The console used to seed these from four hardcoded `true`s, so a flag
    // disabled network-wide still rendered as on.
    for (const flag of flags) {
      assert.equal(typeof flag.id, "string");
      assert.equal(typeof flag.enabled, "boolean");
    }
  });

  live("economics report both sides of the margin in centavos", async () => {
    const [plans, channels] = await Promise.all([
      api.getPlanEconomics(),
      api.getChannelEconomics(),
    ]);

    assert.ok(isCentavos(plans[0].mrrCentavos));
    assert.ok(isCentavos(plans[0].monthlyCostCentavos));
    assert.ok(isCentavos(channels[0].revenueCentavos));
    assert.ok(isCentavos(channels[0].costCentavos));
  });

  live("services, adapters, connections and recovery answer", async () => {
    const [services, adapters, connections, recovery] = await Promise.all([
      api.getServices(),
      api.getAdapters(),
      api.getTenantConnections(),
      api.getRecoveryQueue(),
    ]);

    assert.ok(services.length > 0);
    assert.ok(adapters.length > 0);
    assert.ok(connections.length > 0);
    assert.ok(Array.isArray(recovery));
  });
});

describe("counter writes", () => {
  let api: typeof import("./endpoints.ts");
  persona = "owner";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("a customer is found by phone or by email", async () => {
    const byPhone = await api.lookupCustomer({ phone: "+639175550182" });
    const byEmail = await api.lookupCustomer({ email: CUSTOMER_EMAIL });

    assert.equal(byPhone.id, byEmail.id);
    assert.ok(isEan13(byPhone.memberCode), byPhone.memberCode);
    assert.equal(byPhone.isMember, true);
  });

  live("a balance says where the card stands", async () => {
    const balance = await api.getCustomerBalance(SCRATCH_CUSTOMER);

    assert.equal(balance.customerId, SCRATCH_CUSTOMER);
    assert.ok(Number.isInteger(balance.balance));
    // Floored server-side: nobody holds negative stamps, and the counter
    // would otherwise render "-1 of 8" to a cashier mid-service.
    assert.ok(balance.balance >= 0);
    assert.ok(balance.target > 0);
  });

  live("a stamp moves the balance the counter just read", async () => {
    const before = await api.getCustomerBalance(SCRATCH_CUSTOMER);
    const visit = await api.recordVisit(
      { customerId: SCRATCH_CUSTOMER, amountCentavos: 15000 },
      `visit_CONTRACT_BAL_${Date.now()}`,
    );

    try {
      assert.equal(visit.stampsBefore, before.balance);
      const after = await api.getCustomerBalance(SCRATCH_CUSTOMER);
      assert.equal(after.balance, visit.stampsAfter);
    } finally {
      await voidVisit(visit.id);
    }
  });

  live("the same idempotency key never stamps twice", async () => {
    // The whole reason the header exists: a counter tablet loses wifi
    // mid-request and the cashier presses the button again.
    const key = `visit_CONTRACT_${Date.now()}`;
    const body = { customerId: SCRATCH_CUSTOMER, amountCentavos: 25000 };

    const first = await api.recordVisit(body, key);
    const replay = await api.recordVisit(body, key);

    try {
      assert.equal(replay.id, first.id, "a replay must return the original visit");
      assert.equal(replay.stampsAfter, first.stampsAfter, "and must not move the balance");
      assert.equal(first.stampsAfter, first.stampsBefore + 1);
    } finally {
      await voidVisit(first.id);
    }
  });

  live("a different key on the same customer does stamp again", async () => {
    const first = await api.recordVisit(
      { customerId: SCRATCH_CUSTOMER, amountCentavos: 10000 },
      `visit_CONTRACT_A_${Date.now()}`,
    );
    const second = await api.recordVisit(
      { customerId: SCRATCH_CUSTOMER, amountCentavos: 10000 },
      `visit_CONTRACT_B_${Date.now()}`,
    );

    try {
      assert.equal(second.stampsBefore, first.stampsAfter);
    } finally {
      await voidVisit(second.id);
      await voidVisit(first.id);
    }
  });

  live("toggling an automation answers with the state it landed on", async () => {
    const [automation] = await api.getAutomations();

    const first = await api.toggleAutomation(automation.id);
    const second = await api.toggleAutomation(automation.id);

    assert.equal(typeof first.enabled, "boolean");
    assert.equal(second.enabled, !first.enabled, "a second toggle flips it back");
  });

  live("a rejected program names the field that failed", async () => {
    // 31 is outside the published 1-30 stamp range. What matters is the
    // shape of the refusal: a form has to mark the input that caused it.
    const rejected = await api
      .createProgram({ type: "Stamps", name: "Too many", target: 31 })
      .then(() => null)
      .catch((error: unknown) => error);

    assert.ok(rejected instanceof ApiError, "expected an ApiError");
    assert.equal(rejected.status, 422);
    assert.equal(typeof rejected.message, "string");
    assert.ok(!rejected.message.startsWith("[object"), rejected.message);

    const fields = fieldErrors(rejected).map((item) => item.field);
    assert.ok(fields.includes("target"), `fields were ${JSON.stringify(fields)}`);
  });
});

describe("durability", () => {
  persona = "owner";

  live("a write is readable by the very next request", async () => {
    /*
     * This is the shape of a real bug, kept as a test.
     *
     * `get_session` commits in a FastAPI yield-dependency's exit code, which
     * runs after the response has been sent. A client that acted on the
     * response immediately - which is what a redirect after login is - could
     * be told the session it had just been given did not exist. Four in
     * twenty, and never reproducible by hand, because a browser is slow
     * enough to hide it.
     *
     * It lives here rather than in the backend's own suite because that suite
     * overrides the session dependency, so the bug is invisible from inside
     * the application. It is only reachable over HTTP.
     */
    let missing = 0;
    let measured = 0;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const signedIn = await realFetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ADMIN),
      });
      // /auth/* is capped per caller per minute, and this loop is the
      // heaviest user of that budget in the file. Stopping at the ceiling
      // measures fewer attempts rather than reporting a rate limit as a
      // durability failure.
      if (signedIn.status === 429) break;
      assert.equal(signedIn.status, 200);
      await signedIn.json();
      measured += 1;
      const cookie = signedIn.headers.getSetCookie()[0].split(";")[0];

      // No await in between. A deliberately wrong TOTP, because what is under
      // test is whether the session is found at all.
      const used = await realFetch(`${API}/auth/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ code: "000000" }),
      });
      if ((await used.json()).detail === "Session expired or revoked") missing += 1;
    }

    assert.ok(measured >= 4, `only ${measured} attempts got through the rate limit`);
    assert.equal(
      missing,
      0,
      `${missing} of ${measured} sessions were not committed before the response`,
    );
  });
});

/* ── Ahead of the backend, now behind it ─────────────────────────────
   The routes the frontend built against before they existed. Each case
   asserts on the real body, so the day a shape drifts the app finds out
   here rather than in a wallet. */

describe("the public marketplace", () => {
  let api: typeof import("./endpoints.ts");
  persona = "customer";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("discover lists every shop with a live program, featured first", async () => {
    const page = await api.getPublicDiscover({ limit: 50 });

    assert.ok(page.items.length > 0, "no shops listed");
    assert.equal(page.total, page.items.length);
    const first = page.items[0];
    for (const key of ["slug", "name", "category", "neighborhood", "reward", "about"]) {
      assert.equal(typeof (first as Record<string, unknown>)[key], "string", key);
    }
    assert.equal(typeof first.featured, "boolean");
    assert.equal(typeof first.open, "boolean");
    assert.ok(Array.isArray(first.hours));
    assert.ok(Array.isArray(first.branches));
    assert.ok(first.branches.length > 0, "a shop with no branches cannot be joined");
    assert.equal(typeof first.branches[0].slug, "string");
    // Featured rows never trail an unfeatured one.
    const firstPlain = page.items.findIndex((s) => !s.featured);
    const lastFeatured = page.items.map((s) => s.featured).lastIndexOf(true);
    assert.ok(firstPlain === -1 || lastFeatured < firstPlain, "featured after plain");
    // Never a sample row from the API.
    assert.equal((first as { preview?: boolean }).preview, undefined);
  });

  live("a branch slug from discover resolves on the poster route", async () => {
    const page = await api.getPublicDiscover({ limit: 5 });
    const branch = page.items[0].branches[0];
    const poster = await api.getJoinPage(branch.slug);

    assert.equal(poster.branch, branch.name);
  });

  live("one shop by slug, and the facets", async () => {
    const page = await api.getPublicDiscover({ limit: 1 });
    const shop = await api.getPublicShop(page.items[0].slug);
    assert.equal(shop.slug, page.items[0].slug);

    const [categories, neighborhoods] = await Promise.all([
      api.getPublicCategories(),
      api.getPublicNeighborhoods(),
    ]);
    assert.ok(categories.length > 0);
    assert.equal(typeof categories[0].name, "string");
    assert.ok(Number.isInteger(categories[0].count));
    assert.ok(neighborhoods.length > 0);
  });

  live("distance is metres when a position is sent", async () => {
    const page = await api.getPublicDiscover({ lat: 14.5716, lng: 121.0602, limit: 5 });
    const near = page.items.find((s) => s.distanceMetres !== null);
    assert.ok(near, "no shop carries a distance");
    assert.ok(Number.isInteger(near.distanceMetres));
  });

  live("the push state names whether push is configured", async () => {
    const state = await api.getPushState();
    assert.equal(typeof state.vapidPublicKey, "string");
    assert.equal(typeof state.subscribed, "boolean");
  });
});

describe("billing behind the flags", () => {
  let api: typeof import("./endpoints.ts");
  persona = "owner";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("billing carries the two flags and QR Ph as the only method", async () => {
    const billing = await api.getBilling();

    assert.equal(typeof billing.paidTiersOpen, "boolean");
    assert.equal(typeof billing.creditPurchasesOpen, "boolean");
    assert.deepEqual(billing.paymentMethods, ["qrph"]);
    assert.equal(typeof billing.founding, "boolean");
    assert.equal(billing.foundingCreditMonths, 3);
  });

  live("a paid tier is refused while the flag is off, with the beta wording", async () => {
    const billing = await api.getBilling();
    if (billing.paidTiersOpen) return;
    const { ApiError } = await import("./http.ts");
    await assert.rejects(
      api.changePlan("Core"),
      (error: unknown) =>
        error instanceof ApiError && error.status === 409 && /beta|not open/i.test(error.message),
    );
  });

  live("credit purchase is refused while its flag is off", async () => {
    const billing = await api.getBilling();
    if (billing.creditPurchasesOpen) return;
    const { ApiError } = await import("./http.ts");
    await assert.rejects(
      api.purchaseCredits({ bundle: "payg", segments: 100 }),
      (error: unknown) => error instanceof ApiError && error.status === 409,
    );
  });

  live("featured placement answers with its source and the add-on price", async () => {
    const featured = await api.getFeaturedPlacement();
    assert.equal(typeof featured.active, "boolean");
    assert.ok([null, "plan", "addon"].includes(featured.source));
    assert.equal(featured.priceCentavos, 29_900);
  });
});

describe("the stamp card, as sold", () => {
  let api: typeof import("./endpoints.ts");
  persona = "owner";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("a stamp program carries every rule the site publishes", async () => {
    const programs = await api.getPrograms();
    const stamps = programs.find((p) => p.type === "Stamps");
    assert.ok(stamps, "no stamp program");
    assert.ok(stamps.rules, "no rules on the stamp program");
    const rules = stamps.rules;
    assert.equal(typeof rules.welcomeStamp, "boolean");
    for (const key of ["cooldownMinutes", "minSpendCentavos", "expiryDays", "rewardGraceDays", "maxCompletions"] as const) {
      assert.ok(Number.isInteger(rules[key]), key);
    }
    assert.ok(["expire", "carryOver"].includes(rules.onClose));
    assert.ok(rules.startsAt === null || isIso(rules.startsAt));
    assert.ok(rules.endsAt === null || isIso(rules.endsAt));
    // A program that is not a stamp card carries no rules.
    const other = programs.find((p) => p.type !== "Stamps");
    if (other) assert.equal(other.rules ?? null, null);
  });

  live("a target above thirty is refused on the field", async () => {
    const stamps = (await api.getPrograms()).find((p) => p.type === "Stamps");
    assert.ok(stamps);
    const { ApiError, fieldErrors } = await import("./http.ts");
    await assert.rejects(
      api.updateProgram(stamps.id, { target: 31 }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 422 &&
        fieldErrors(error).some((f) => f.field === "target"),
    );
  });

  live("the close preview counts open cards for either outcome", async () => {
    const stamps = (await api.getPrograms()).find((p) => p.type === "Stamps");
    assert.ok(stamps);
    const preview = await api.previewClose(stamps.id, "expire");
    for (const key of ["openCards", "expiring", "carriedOver", "heldRewards"] as const) {
      assert.ok(Number.isInteger(preview[key]), key);
    }
    assert.equal(preview.carriedOver, 0);
  });
});

describe("the Core and Grow levers", () => {
  let api: typeof import("./endpoints.ts");
  persona = "owner";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("bonus windows carry their schedule, status and an estimated cost", async () => {
    const windows = await api.getBonusWindows();
    assert.ok(Array.isArray(windows));
    for (const w of windows) {
      assert.ok(Number.isFinite(w.multiplier) && w.multiplier >= 1);
      assert.ok(Array.isArray(w.days));
      assert.ok(["scheduled", "live", "paused", "ended"].includes(w.status), w.status);
      assert.ok(isCentavos(w.estimatedCostCentavos));
      assert.ok(Number.isInteger(w.stampsGranted));
      assert.equal((w as { preview?: boolean }).preview, undefined);
    }
  });

  live("promo codes are uppercase and say what they grant", async () => {
    const codes = await api.getPromoCodes();
    for (const c of codes) {
      assert.equal(c.code, c.code.toUpperCase());
      assert.ok(["stamp", "points", "coupon"].includes(c.grants));
      assert.ok(["active", "paused", "ended"].includes(c.status));
      assert.ok(Number.isInteger(c.redemptions));
    }
  });

  live("store credit is signed centavos with a running balance and a reason", async () => {
    const entries = await api.getStoreCredit();
    for (const e of entries) {
      assert.ok(isCentavos(e.amountCentavos));
      assert.ok(isCentavos(e.balanceAfterCentavos));
      assert.equal(typeof e.reason, "string");
      assert.ok(isIso(e.occurredAt));
    }
  });

  live("suki tiers climb by rank with a benefit and an earn rate", async () => {
    const program = await api.getSukiTiers();
    assert.ok(["visits", "spend"].includes(program.basis));
    assert.ok(Number.isInteger(program.downgradeAfterDays));
    const ranks = program.tiers.map((t) => t.rank);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
    for (const t of program.tiers) {
      assert.equal(typeof t.benefit, "string");
      assert.ok(Number.isInteger(t.earnRateBps) && t.earnRateBps >= 10_000);
    }
  });

  live("missions carry a goal, a window and a bonus", async () => {
    const missions = await api.getMissions();
    for (const m of missions) {
      assert.ok(["visits", "items", "spend"].includes(m.goal));
      assert.ok(Number.isInteger(m.targetCount) && m.targetCount > 0);
      assert.ok(["scheduled", "live", "ended"].includes(m.status));
      assert.match(m.endsOn, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  live("gifts name both members and where they went", async () => {
    const gifts = await api.getBusinessGifts();
    for (const g of gifts) {
      assert.ok(["reward", "points"].includes(g.kind));
      assert.equal(typeof g.fromName, "string");
      assert.equal(typeof g.toName, "string");
      assert.ok(isIso(g.sentAt));
    }
  });

  live("category rates are basis points per category", async () => {
    const points = (await api.getPrograms()).find((p) => p.type === "Points");
    if (!points) return;
    const rates = await api.getCategoryRates(points.id);
    for (const r of rates) {
      assert.equal(typeof r.category, "string");
      assert.ok(Number.isInteger(r.rateBps));
      assert.ok(Array.isArray(r.items));
    }
  });
});

describe("the wallet's card states", () => {
  let api: typeof import("./endpoints.ts");
  persona = "customer";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("every card names its state, plan and badge, and its own target", async () => {
    const cards = await api.getWallet();
    assert.ok(cards.length > 0, "no cards");
    for (const card of cards) {
      assert.ok(
        ["pending", "active", "completed", "closed"].includes(card.state ?? ""),
        `card state ${String(card.state)}`,
      );
      assert.equal(typeof card.badge, "boolean");
      assert.ok(["Launch", "Core", "Grow", "Scale"].includes(card.plan ?? ""));
      assert.ok(Number.isInteger(card.target));
      assert.ok(card.pendingStamp === null || isIso(card.pendingStamp?.expiresAt));
      assert.equal((card as { preview?: boolean }).preview, undefined);
    }
    const stamps = cards.find((c) => c.kind === "Stamps");
    assert.ok(stamps?.rules, "a stamp card carries its rules");
  });

  live("gifts sent and received carry a direction", async () => {
    const gifts = await api.getCustomerGifts();
    assert.ok(Array.isArray(gifts));
    for (const g of gifts) assert.ok(["sent", "received"].includes(g.direction));
  });

  live("a promo code for a shop the customer never joined is refused plainly", async () => {
    const { ApiError } = await import("./http.ts");
    await assert.rejects(
      api.redeemPromoCode({ businessId: "biz_does_not_exist", code: "WELCOME" }),
      (error: unknown) => error instanceof ApiError && [404, 409].includes(error.status),
    );
  });

  live("pending approvals is a list, empty or not", async () => {
    const pending = await api.getPendingApprovals();
    assert.ok(Array.isArray(pending));
    for (const row of pending) {
      assert.ok(isIso(row.expiresAt));
      assert.ok(isCentavos(row.valueCentavos));
    }
  });
});

describe("founding merchants and add-ons", () => {
  let api: typeof import("./endpoints.ts");
  persona = "admin";

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
  });

  live("tenants carry founding and featured", async () => {
    const tenants = await api.getTenants();
    assert.equal(typeof tenants[0].founding, "boolean");
    assert.equal(typeof tenants[0].featured, "boolean");
  });

  live("applications carry founding and setup notes", async () => {
    const applications = await api.getPartnerApplications();
    if (applications.length === 0) return;
    assert.equal(typeof applications[0].founding, "boolean");
    assert.equal(typeof applications[0].setupNotes, "string");
  });

  live("add-ons list with a business name and centavos", async () => {
    const addOns = await api.getAddOns();
    for (const row of addOns) {
      assert.equal(typeof row.business, "string");
      assert.ok(isCentavos(row.priceCentavos));
      assert.ok(["featured", "branch_reporting", "setup"].includes(row.addOn));
    }
  });
});
