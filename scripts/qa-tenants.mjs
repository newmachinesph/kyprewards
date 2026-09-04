/**
 * Every merchant, against the features it actually runs.
 *
 * Sweet Crumbs runs all eight program types, so it was the only shop anything
 * was ever tested against - and a bug that only bites a shop running two of
 * them had nowhere to surface. These are six different tenants on three plans
 * with five different mixes, each driven through its own counter.
 *
 * It also asks the question one tenant can never ask of itself: can this shop
 * see, stamp or spend anything belonging to that one.
 */
const API = "http://localhost:8000/api/v1";
const PASSWORD = "DemoPass123!";
const problems = [];
const did = [];

const jars = new Map();

async function call(who, path, { method = "GET", body, key } = {}) {
  const headers = { "Content-Type": "application/json" };
  const cookie = jars.get(who);
  if (cookie) headers.cookie = cookie;
  if (key) headers["Idempotency-Key"] = key;
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const raw of r.headers.getSetCookie()) jars.set(who, raw.split(";")[0]);
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

const unique = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

/* The six shops, and the email each owner signs in with. Mirrors
   `_seed_neighbours` in the backend seed. */
const SHOPS = [
  { who: "sweet", email: "mara@sweetcrumbs.ph", name: "Sweet Crumbs" },
  { who: "sage", email: "owner@sagesteam.ph", name: "Sage & Steam" },
  { who: "rooted", email: "owner@rootedstudio.ph", name: "Rooted Studio" },
  { who: "barbers", email: "owner@commongroundbarbers.ph", name: "Common Ground Barbers" },
  { who: "thread", email: "owner@cornerthread.ph", name: "Corner Thread" },
  { who: "pace", email: "owner@pacehouse.ph", name: "Pace House" },
];

/* ── Sign every owner in ───────────────────────────────────────────── */

for (const shop of SHOPS) {
  await check(`${shop.name}: the owner can sign in`, async () => {
    const signed = await call(shop.who, "/auth/login", {
      method: "POST",
      body: { email: shop.email, password: PASSWORD },
    });
    expect(signed.status, 200, "login");
    if (signed.body.needsWorkspace) {
      const ws = await call(shop.who, "/auth/workspaces");
      await call(shop.who, `/auth/workspaces/${ws.body[0].merchantId}/select`, { method: "POST" });
    }
  });
}

/* ── Each shop's own customer, so nothing is shared ────────────────── */

const members = new Map();
const mobiles = new Map();
for (const shop of SHOPS) {
  await check(`${shop.name}: a walk-in joins`, async () => {
    const mobile = `+6391755${Math.floor(Math.random() * 9e4 + 1e4)}`;
    const made = await call(shop.who, "/customers", {
      method: "POST",
      body: { name: `${shop.name} regular`, mobile },
    });
    expect(made.status, 201, "create customer");
    if (!/^\d{13}$/.test(made.body.memberCode)) {
      throw new Error(`member code is not thirteen digits: ${made.body.memberCode}`);
    }
    members.set(shop.who, made.body.id);
    mobiles.set(shop.who, mobile);
    return made.body.memberCode;
  });
}

/**
 * The customer's own session, so they can approve a redemption on their
 * phone: since the stamp-card rules landed, a reserved reward waits for
 * `POST /customer/redemptions/{id}/approve` before the counter may commit.
 * The one-time code is read back from the dev sink, as a person reads it
 * from their phone.
 */
async function signInCustomer(who) {
  const key = `${who}_customer`;
  const mobile = mobiles.get(who);
  const asked = await call(key, "/auth/otp/request", { method: "POST", body: { identifier: mobile } });
  expect(asked.status, 200, "otp request");
  const sent = await call(key, "/_dev/messages?purpose=otp&limit=1");
  const code = sent.body?.[0]?.body?.match(/\d{6}/)?.[0];
  if (!code) throw new Error("no one-time code reached the dev sink");
  const verified = await call(key, "/auth/otp/verify", {
    method: "POST",
    body: { identifier: mobile, code },
  });
  expect(verified.status, 200, "otp verify");
  return key;
}

/* ── Whatever each shop actually runs ──────────────────────────────── */

for (const shop of SHOPS) {
  const programs = (await call(shop.who, "/business/programs")).body;
  const runs = (type) => programs.find((p) => p.type === type && p.status === "Live");
  const customer = members.get(shop.who);
  const types = programs.filter((p) => p.status === "Live").map((p) => p.type);
  did.push(`  · ${shop.name} runs ${types.join(", ")}`);

  if (runs("Stamps")) {
    await check(`${shop.name}: a stamp card fills and pays out`, async () => {
      const card = runs("Stamps");
      // A real card earns once a day; this suite fills one in a sitting, so
      // the shop sets its cooldown to zero first, the way a merchant would
      // for a lunch-and-dinner service. The cooldown has its own tests.
      const eased = await call(shop.who, `/business/programs/${card.id}`, {
        method: "PATCH",
        body: { cooldownMinutes: 0 },
      });
      expect(eased.status, 200, "set the cooldown to zero");
      for (let i = 0; i < card.target; i += 1) {
        const taken = await call(shop.who, "/transactions", {
          method: "POST",
          key: unique(`${shop.who}_fill_${i}`),
          body: { customerId: customer, amountCentavos: 10_000 },
        });
        expect(taken.status, 201, `stamp ${i + 1}`);
      }
      const balance = (await call(shop.who, `/customers/${customer}/balance`)).body;
      if (!balance.rewardsAvailable) {
        throw new Error(`filled ${card.target} of ${card.target} and earned nothing`);
      }
      return `${balance.balance}/${balance.target}, ${balance.rewardsAvailable} reward`;
    });

    await check(`${shop.name}: the reward is reserved and handed over`, async () => {
      const held = await call(shop.who, "/redemptions/reserve", {
        method: "POST",
        key: unique(`${shop.who}_res`),
        body: { customerId: customer },
      });
      expect(held.status, 201, "reserve");
      expect(held.body.status, "awaiting_customer", "a reserve waits for the customer");
      // Committing before the customer approves is refused.
      const early = await call(shop.who, `/redemptions/${held.body.id}/commit`, { method: "POST" });
      expect(early.status, 409, "commit before approval");
      const asCustomer = await signInCustomer(shop.who);
      const pending = await call(asCustomer, "/customer/redemptions/pending");
      expect(pending.status, 200, "pending approvals");
      if (!pending.body.some((row) => row.id === held.body.id)) {
        throw new Error("the reservation is not waiting in the customer's wallet");
      }
      const approved = await call(asCustomer, `/customer/redemptions/${held.body.id}/approve`, {
        method: "POST",
      });
      expect(approved.status, 200, "customer approves");
      const done = await call(shop.who, `/redemptions/${held.body.id}/commit`, { method: "POST" });
      expect(done.status, 200, "commit");
    });
  }

  if (runs("Points")) {
    await check(`${shop.name}: a sale moves the headline balance`, async () => {
      // `/balance` answers for the shop's headline program, not for every one
      // it runs - so at a shop running stamps beside points this reads the
      // stamp card. That is the counter's contract, and reading it as "points"
      // is how a check ends up asserting the wrong number moved.
      const before = (await call(shop.who, `/customers/${customer}/balance`)).body;
      const taken = await call(shop.who, "/transactions", {
        method: "POST",
        key: unique(`${shop.who}_points`),
        body: { customerId: customer, amountCentavos: 30_000 },
      });
      expect(taken.status, 201, "spend");
      const after = (await call(shop.who, `/customers/${customer}/balance`)).body;
      if (after.balance <= before.balance) {
        throw new Error(`balance did not move: ${before.balance} -> ${after.balance}`);
      }
      return `${after.programName}: ${before.balance} -> ${after.balance}`;
    });
  }

  if (runs("Gift card")) {
    await check(`${shop.name}: a gift card is sold, spent and cannot overspend`, async () => {
      const card = await call(shop.who, "/gift-cards", {
        method: "POST",
        body: { amountCentavos: 100_000, issuedToName: "Tenant QA" },
      });
      expect(card.status, 201, "issue");
      const spent = await call(shop.who, `/gift-cards/${card.body.code}/redeem`, {
        method: "POST",
        body: { amountCentavos: 40_000, reason: "tenant qa" },
      });
      expect(spent.status, 200, "redeem");
      expect(spent.body.balanceCentavos, 60_000, "balance");
      const over = await call(shop.who, `/gift-cards/${card.body.code}/redeem`, {
        method: "POST",
        body: { amountCentavos: 999_999, reason: "overspend" },
      });
      if (over.status < 400) throw new Error(`overspend answered ${over.status}`);
      return card.body.code;
    });
  }

  if (runs("Coupon")) {
    await check(`${shop.name}: a coupon redeems once`, async () => {
      const issued = await call(shop.who, "/coupons", {
        method: "POST",
        body: {
          name: "Tenant QA coupon",
          percentBps: 1_000,
          customerId: customer,
          programId: runs("Coupon").id,
        },
      });
      expect(issued.status, 201, "issue");
      const first = await call(shop.who, "/coupons/redeem", {
        method: "POST",
        body: { code: issued.body.code, customerId: customer },
      });
      expect(first.status, 200, "redeem");
      const again = await call(shop.who, "/coupons/redeem", {
        method: "POST",
        body: { code: issued.body.code, customerId: customer },
      });
      if (again.status < 400) throw new Error("redeemed twice");
    });
  }

  if (runs("Membership")) {
    await check(`${shop.name}: a membership is sold, used and cancelled`, async () => {
      const sold = await call(shop.who, "/memberships/subscribe", {
        method: "POST",
        body: { customerId: customer, programId: runs("Membership").id },
      });
      expect(sold.status, 201, "subscribe");
      const used = await call(shop.who, `/memberships/${sold.body.id}/use-benefit`, {
        method: "POST",
      });
      expect(used.status, 200, "use a benefit");
      const stopped = await call(shop.who, `/memberships/${sold.body.id}/cancel`, {
        method: "POST",
      });
      expect(stopped.status, 200, "cancel");
      return `${used.body.remaining} of ${used.body.included} left before cancelling`;
    });
  }

  if (runs("Multipass")) {
    await check(`${shop.name}: a bundle is sold and drawn down`, async () => {
      const bought = await call(shop.who, "/multipass/purchase", {
        method: "POST",
        body: { customerId: customer, programId: runs("Multipass").id },
      });
      expect(bought.status, 201, "purchase");
      const used = await call(shop.who, "/multipass/use", {
        method: "POST",
        body: { customerId: customer, programId: runs("Multipass").id },
      });
      expect(used.status, 200, "use a pass");
      if (used.body.remaining >= bought.body.remaining) {
        throw new Error(`using a pass did not draw the bundle down: ${bought.body.remaining} -> ${used.body.remaining}`);
      }
      return `${bought.body.remaining} -> ${used.body.remaining}`;
    });
  }

  if (runs("Rewards")) {
    await check(`${shop.name}: the catalog answers`, async () => {
      const catalog = await call(shop.who, `/business/programs/${runs("Rewards").id}/catalog`);
      expect(catalog.status, 200, "catalog");
      return `${catalog.body.length} items`;
    });
  }

  if (runs("Discount")) {
    await check(`${shop.name}: a discount quote is priced`, async () => {
      const quote = await call(
        shop.who,
        `/discounts/quote?customerId=${customer}&amountCentavos=50000`,
      );
      expect(quote.status, 200, "quote");
      if (quote.body.netCentavos > 50_000) throw new Error("the discount made it dearer");
      return `${quote.body.rateBps / 100}% off`;
    });
  }
}

/* ── One tenant must not reach another ─────────────────────────────── */

await check("a shop cannot stamp another shop's customer", async () => {
  const theirs = members.get("sweet");
  const refused = await call("barbers", "/transactions", {
    method: "POST",
    key: unique("cross_stamp"),
    body: { customerId: theirs, amountCentavos: 5_000 },
  });
  // 404 rather than 403: a 403 would confirm the customer exists.
  expect(refused.status, 404, "cross-tenant stamp");
});

await check("a shop cannot read another shop's customer", async () => {
  const refused = await call("barbers", `/customers/${members.get("sweet")}/balance`);
  if (refused.status < 400) throw new Error(`answered ${refused.status}`);
  expect(refused.status, 404, "cross-tenant balance");
});

await check("a shop cannot spend another shop's gift card", async () => {
  const mine = await call("barbers", "/gift-cards", {
    method: "POST",
    body: { amountCentavos: 20_000, issuedToName: "Barbers only" },
  });
  expect(mine.status, 201, "issue");
  const stolen = await call("thread", `/gift-cards/${mine.body.code}/redeem`, {
    method: "POST",
    body: { amountCentavos: 5_000, reason: "not mine" },
  });
  if (stolen.status < 400) throw new Error(`another shop spent it: ${stolen.status}`);
});

await check("a shop's customer list holds only its own", async () => {
  const theirs = new Set(
    ((await call("sweet", "/business/customers", { method: "GET" })).body ?? []).map((c) => c.id),
  );
  const mine = (await call("barbers", "/business/customers")).body ?? [];
  const leaked = mine.filter((c) => theirs.has(c.id));
  if (leaked.length) throw new Error(`${leaked.length} of another shop's customers are visible`);
  return `${mine.length} own customers`;
});

await check("a Core shop is refused a feature its plan does not include", async () => {
  // Sage & Steam is on Core; memberships start at Grow.
  const refused = await call("sage", "/memberships/subscribe", {
    method: "POST",
    body: { customerId: members.get("sage"), programId: "prog_whatever" },
  });
  if (refused.status < 400) throw new Error(`answered ${refused.status}`);
  return `answered ${refused.status}`;
});

console.log("\n--- every merchant, its own features ---");
for (const line of did) console.log(" ", line);
console.log(`\n--- ${problems.length} problem(s) ---`);
for (const line of problems) console.log(" -", line);
process.exitCode = problems.length ? 1 : 0;
