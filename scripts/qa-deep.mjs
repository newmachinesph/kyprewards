/**
 * The awkward paths.
 *
 * The happy journeys pass; bugs live in the eight program types at the till,
 * in doing a thing twice, and in whether what the merchant just did shows up
 * for the customer. Driven through the API with real sessions rather than the
 * UI, so one failure does not hide the twenty checks behind it.
 */
const API = "http://localhost:8000/api/v1";
const problems = [];
const did = [];

const jar = { owner: "", customer: "" };

async function call(who, path, { method = "GET", body, key } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (jar[who]) headers.cookie = jar[who];
  if (key) headers["Idempotency-Key"] = key;
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const raw of r.headers.getSetCookie()) jar[who] = raw.split(";")[0];
  const text = await r.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: r.status, body: parsed };
}

const check = async (label, fn) => {
  try {
    const note = await fn();
    did.push(`ok   ${label}${note ? ` — ${note}` : ""}`);
  } catch (error) {
    problems.push(`${label}: ${String(error.message ?? error).slice(0, 260)}`);
    did.push(`FAIL ${label}`);
  }
};

const expect = (got, want, what) => {
  if (got !== want) throw new Error(`${what}: expected ${want}, got ${got}`);
};

/* ── Sessions ──────────────────────────────────────────────────────── */

await call("owner", "/auth/login", {
  method: "POST",
  body: { email: "mara@sweetcrumbs.ph", password: "DemoPass123!" },
});
await call("customer", "/auth/otp/request", {
  method: "POST",
  body: { identifier: "jacqueline.daniel@example.com" },
});
const sent = await (await fetch(`${API}/_dev/messages?purpose=otp&limit=1`)).json();
await call("customer", "/auth/otp/verify", {
  method: "POST",
  body: {
    identifier: "jacqueline.daniel@example.com",
    code: /\d{6}/.exec(sent[0].body)[0],
  },
});

const CUSTOMER = "cus_1001";
const stamp = (n) => `deep_${n}_${Date.now()}`;

/* ── The eight program types at the till ───────────────────────────── */

const programs = (await call("owner", "/business/programs")).body;
const live = (type) => programs.find((x) => x.type === type && x.status === "Live");

await check("a stamp moves the balance the counter just read", async () => {
  const before = (await call("owner", `/customers/${CUSTOMER}/balance`)).body;
  const taken = await call("owner", "/transactions", {
    method: "POST",
    key: stamp("stamp"),
    body: { customerId: CUSTOMER, amountCentavos: 25_000 },
  });
  expect(taken.status, 201, "stamp");
  const after = (await call("owner", `/customers/${CUSTOMER}/balance`)).body;
  if (after.balance <= before.balance) {
    throw new Error(`balance did not move: ${before.balance} -> ${after.balance}`);
  }
  return `${before.balance} -> ${after.balance}`;
});

await check("the same key twice stamps once", async () => {
  const key = stamp("replay");
  const one = await call("owner", "/transactions", {
    method: "POST",
    key,
    body: { customerId: CUSTOMER, amountCentavos: 5_000 },
  });
  const two = await call("owner", "/transactions", {
    method: "POST",
    key,
    body: { customerId: CUSTOMER, amountCentavos: 5_000 },
  });
  expect(two.status, one.status, "replay status");
  if (one.body.id !== two.body.id) throw new Error("replay produced a second transaction");
});

await check("the same key with a different body is refused", async () => {
  const key = stamp("conflict");
  await call("owner", "/transactions", {
    method: "POST",
    key,
    body: { customerId: CUSTOMER, amountCentavos: 5_000 },
  });
  const changed = await call("owner", "/transactions", {
    method: "POST",
    key,
    body: { customerId: CUSTOMER, amountCentavos: 9_999 },
  });
  expect(changed.status, 409, "conflicting replay");
});

await check("a sale cannot be voided twice", async () => {
  const made = await call("owner", "/transactions", {
    method: "POST",
    key: stamp("void"),
    body: { customerId: CUSTOMER, amountCentavos: 3_000 },
  });
  expect((await call("owner", `/transactions/${made.body.id}/void`, { method: "POST" })).status, 200, "first void");
  expect((await call("owner", `/transactions/${made.body.id}/void`, { method: "POST" })).status, 409, "second void");
});

await check("a voided sale cannot then be refunded", async () => {
  const made = await call("owner", "/transactions", {
    method: "POST",
    key: stamp("voidrefund"),
    body: { customerId: CUSTOMER, amountCentavos: 3_000 },
  });
  await call("owner", `/transactions/${made.body.id}/void`, { method: "POST" });
  expect((await call("owner", `/transactions/${made.body.id}/refund`, { method: "POST" })).status, 409, "refund after void");
});

await check("a gift card is issued, read, spent and cannot overspend", async () => {
  const card = await call("owner", "/gift-cards", {
    method: "POST",
    body: { amountCentavos: 50_000, issuedToName: "Deep QA" },
  });
  expect(card.status, 201, "issue");
  const read = await call("owner", `/gift-cards/${card.body.code}`);
  expect(read.status, 200, "read back");
  expect(read.body.balanceCentavos, 50_000, "balance");

  const spent = await call("owner", `/gift-cards/${card.body.code}/redeem`, {
    method: "POST",
    body: { amountCentavos: 20_000, reason: "deep qa" },
  });
  expect(spent.status, 200, "redeem");
  expect(spent.body.balanceCentavos, 30_000, "balance after");

  const over = await call("owner", `/gift-cards/${card.body.code}/redeem`, {
    method: "POST",
    body: { amountCentavos: 99_999, reason: "overspend" },
  });
  if (over.status < 400) throw new Error(`overspending a gift card answered ${over.status}`);

  const entries = await call("owner", `/gift-cards/${card.body.code}/entries`);
  expect(entries.status, 200, "statement");
  if (!entries.body.length) throw new Error("statement is empty after a redemption");
  return `${entries.body.length} entries`;
});

await check("a coupon cannot be redeemed twice", async () => {
  const program = live("Coupon");
  if (!program) return "no live coupon program";
  const issued = await call("owner", "/coupons", {
    method: "POST",
    body: {
      name: "Deep QA double stamp",
      percentBps: 1000,
      customerId: CUSTOMER,
      programId: program.id,
    },
  });
  if (issued.status >= 400) throw new Error(`issue answered ${issued.status}`);
  const code = issued.body.code;
  const first = await call("owner", "/coupons/redeem", {
    method: "POST",
    body: { code, customerId: CUSTOMER },
  });
  expect(first.status, 200, "first redemption");
  const second = await call("owner", "/coupons/redeem", {
    method: "POST",
    body: { code, customerId: CUSTOMER },
  });
  if (second.status < 400) throw new Error("a coupon was redeemed twice");
});

await check("a reward reserve can be cancelled and then re-reserved", async () => {
  const held = await call("owner", `/customers/${CUSTOMER}/balance`);
  if (!held.body.rewardsAvailable) return "no reward earned to reserve";
  const reserved = await call("owner", "/redemptions/reserve", {
    method: "POST",
    key: stamp("reserve"),
    body: { customerId: CUSTOMER },
  });
  expect(reserved.status, 201, "reserve");
  const cancelled = await call("owner", `/redemptions/${reserved.body.id}/cancel`, { method: "POST" });
  expect(cancelled.status, 200, "cancel");
  const again = await call("owner", "/redemptions/reserve", {
    method: "POST",
    key: stamp("reserve2"),
    body: { customerId: CUSTOMER },
  });
  expect(again.status, 201, "re-reserve after cancel");
  await call("owner", `/redemptions/${again.body.id}/cancel`, { method: "POST" });
});

await check("a program target outside 1-30 is refused by field", async () => {
  const program = live("Stamps");
  const bad = await call("owner", `/business/programs/${program.id}`, {
    method: "PATCH",
    body: { target: 99 },
  });
  expect(bad.status, 422, "target 99");
  if (!JSON.stringify(bad.body).includes("target")) throw new Error("the refusal does not name the field");
});

await check("a staff invitation needs a real email", async () => {
  const bad = await call("owner", "/business/staff/invites", {
    method: "POST",
    body: { name: "No Address", email: "not-an-email", role: "Cashier" },
  });
  expect(bad.status, 422, "bad email");
  if (!JSON.stringify(bad.body).includes("email")) throw new Error("the refusal does not name the field");
});

await check("a customer profile cannot be given a malformed email", async () => {
  const bad = await call("customer", "/customer/profile", {
    method: "PATCH",
    body: { email: "still-not-an-email" },
  });
  expect(bad.status, 422, "bad profile email");
});

/* ── Does the customer see what the merchant did? ──────────────────── */

await check("a stamp at the till reaches the customer's wallet", async () => {
  const before = (await call("customer", "/customer/wallet")).body;
  const card = before.find((c) => c.business.includes("Sweet Crumbs") && c.target > 0);
  if (!card) throw new Error("no stamp card in the wallet");

  await call("owner", "/transactions", {
    method: "POST",
    key: stamp("crosscheck"),
    body: { customerId: CUSTOMER, amountCentavos: 15_000 },
  });

  const after = (await call("customer", "/customer/wallet")).body;
  const same = after.find((c) => c.programId === card.programId);
  if (same.progress <= card.progress) {
    throw new Error(`wallet did not move: ${card.progress} -> ${same.progress}`);
  }
  return `${card.progress} -> ${same.progress}`;
});

await check("the visit shows in the customer's activity", async () => {
  const activity = (await call("customer", "/customer/activity")).body;
  if (!activity.length) throw new Error("activity is empty after a stamp");
  return `${activity.length} entries`;
});

await check("a customer reissue invalidates the card at the till", async () => {
  const before = (await call("customer", "/customer/profile")).body.memberCode;
  const after = (await call("customer", "/customer/member-code/reissue", { method: "POST" })).body
    .memberCode;
  if (before === after) throw new Error("reissue returned the same code");

  const dead = await call("owner", "/transactions", {
    method: "POST",
    key: stamp("dead"),
    body: { memberCode: before, amountCentavos: 1_000 },
  });
  expect(dead.status, 404, "old card");
  const live2 = await call("owner", "/transactions", {
    method: "POST",
    key: stamp("live"),
    body: { memberCode: after, amountCentavos: 1_000 },
  });
  expect(live2.status, 201, "new card");
});

await check("leaving a shop removes its card from the wallet", async () => {
  const discover = (await call("customer", "/customer/discover")).body;
  // `joined` is the API's own answer. Comparing wallet businessIds by hand
  // got this wrong and made a correct 409 look like a bug.
  const joinable = discover.find((d) => !d.joined);
  if (!joinable) return "nothing new to join";

  const joined = await call("customer", `/customer/discover/${joinable.businessId}/join`, {
    method: "POST",
  });
  if (joined.status >= 400) throw new Error(`join answered ${joined.status}`);

  const left = await call("customer", `/customer/wallet/${joined.body.id}/leave`, { method: "POST" });
  expect(left.status, 204, "leave");

  const after = (await call("customer", "/customer/wallet")).body;
  if (after.some((c) => c.id === joined.body.id)) throw new Error("the card is still in the wallet");
});

await check("a customer cannot read another shop's data", async () => {
  const refused = await call("customer", "/business/customers");
  if (refused.status < 400) throw new Error(`a customer read the merchant list: ${refused.status}`);
  expect(refused.status, 403, "customer on a business route");
});

await check("an owner cannot read the platform console", async () => {
  const refused = await call("owner", "/admin/tenants");
  if (refused.status < 400) throw new Error(`an owner read the admin console: ${refused.status}`);
});

console.log("\n--- deep checks ---");
for (const line of did) console.log(" ", line);
console.log(`\n--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(" -", line);
