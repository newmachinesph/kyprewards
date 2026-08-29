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
import { createHmac } from "node:crypto";
import { before, describe, test } from "node:test";

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

/* ── One cookie jar, because the session is an httpOnly cookie ────────
   The browser does this for us and `http()` relies on it. Node does not,
   so the jar is patched in around global fetch - which also means the
   accessors are exercised exactly as shipped, with no test seam. */

let cookie = "";
const realFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await realFetch(input, { ...init, headers });
  for (const raw of response.headers.getSetCookie()) {
    cookie = raw.split(";")[0];
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

async function asOwner() {
  cookie = "";
  await post("/auth/login", OWNER);
}

async function asAdmin() {
  cookie = "";
  await post("/auth/login", ADMIN);
  await post("/auth/mfa/verify", { code: totp(ADMIN_MFA_SECRET) });
}

async function asCustomer() {
  cookie = "";
  await post("/auth/otp/request", { identifier: CUSTOMER_EMAIL });
  const sent = await (await fetch(`${API}/_dev/messages?purpose=otp&limit=1`)).json();
  const code = /\d{6}/.exec(sent[0].body)?.[0];
  assert.ok(code, "no OTP reached the dev sink");
  await post("/auth/otp/verify", { identifier: CUSTOMER_EMAIL, code });
}

/** Skips the body when the stack is down, so the suite stays runnable. */
const live = (name: string, body: () => Promise<void>) =>
  test(name, { skip: !reachable && "API not reachable" }, body);

const isIso = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

/** Money crosses the wire as an integer count of centavos, never a float. */
const isCentavos = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value);

describe("business workspace", () => {
  let api: typeof import("./endpoints.ts");

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
    await asOwner();
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

    assert.ok(isIso(staff[0].lastActiveAt));
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

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
    await asCustomer();
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

    // The customer's one identity across every business they join - the whole
    // point of the wallet, and absent from the fixture.
    assert.match(profile.memberCode, /^KYP-/);
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

  before(async () => {
    if (!reachable) return;
    api = await import("./endpoints.ts");
    await asAdmin();
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
