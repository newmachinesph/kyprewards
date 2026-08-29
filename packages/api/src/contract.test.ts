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
    assert.match(byPhone.memberCode, /^KYP-/);
    assert.equal(byPhone.isMember, true);
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
