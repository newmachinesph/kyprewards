/**
 * Randomised model checking of the free tier.
 *
 * Every other suite asserts a scenario somebody chose, which means it only
 * ever finds the bugs that scenario was written to look for. This one invents
 * shops instead: a random stamp target, the welcome stamp on or off, a random
 * cooldown, a random minimum spend, a random completion cap and a random run
 * window - then drives a random sequence of visits through the real API and
 * checks the result against a model of what the rules say should have
 * happened.
 *
 * The model is the point. Nothing here asserts "the balance is 5"; it asserts
 * that the balance is what the rules imply from the visits that were sent, so
 * a rule that quietly changes shows up as a disagreement rather than as a
 * test somebody forgot to update.
 *
 *   node scripts/qa-fuzz.mjs            # random seed, printed
 *   SEED=12345 node scripts/qa-fuzz.mjs # replay a failure exactly
 *   SHOPS=12 node scripts/qa-fuzz.mjs   # more scenarios
 */

import { freshTotp, openApprovedShop, signInAdmin } from "./open-shop.mjs";

const API = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";
const SHOPS = Number(process.env.SHOPS ?? 6);
const SEED = Number(process.env.SEED ?? Math.floor(Math.random() * 1e9));

/* A seeded generator, so a failing run is reproducible from its seed alone.
   mulberry32: small, fast, and good enough to vary test inputs. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(SEED);
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (low, high) => low + Math.floor(random() * (high - low + 1));

/* ── reporting ───────────────────────────────────────────────────────── */

const failures = [];
const notes = [];
let checks = 0;

const expect = (label, pass, detail = "") => {
  checks += 1;
  if (!pass) failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
  return pass;
};

/* ── one actor, one cookie jar ───────────────────────────────────────── */

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
        /* not json */
      }
      return { status: response.status, body: json, text };
    },
  };
}

/* Philippine mobiles: a real prefix, because the API validates through
   libphonenumber and an invented one fails as a bad number rather than as a
   test of anything. */
const run = String(Date.now()).slice(-6);
let handed = 0;
const mobile = () => `+63917${run}${String(handed++ % 10)}`.slice(0, 13);

/* ── a randomised shop ───────────────────────────────────────────────── */

function inventRules() {
  // Every knob the card carries, drawn independently.
  const window = pick(["none", "none", "open", "future", "past"]);
  const now = Date.now();
  return {
    target: pick([3, 5, 6, 8, 8, 10, 12, 15, 20, 30]),
    welcomeStamp: random() < 0.6,
    // Zero most of the time, so a sequence of visits is testable in one
    // sitting; the cooldown gets its own deliberate check below.
    cooldownMinutes: random() < 0.75 ? 0 : pick([1, 60, 1440]),
    minSpendCentavos: random() < 0.5 ? 0 : pick([5_000, 10_000, 25_000]),
    expiryDays: random() < 0.5 ? 0 : pick([1, 7, 30, 90, 365]),
    maxCompletions: random() < 0.6 ? 0 : between(1, 3),
    startsAt:
      window === "future"
        ? new Date(now + 7 * 86_400_000).toISOString()
        : window === "open" || window === "past"
          ? new Date(now - 7 * 86_400_000).toISOString()
          : null,
    endsAt:
      window === "past"
        ? new Date(now - 86_400_000).toISOString()
        : window === "open"
          ? new Date(now + 30 * 86_400_000).toISOString()
          : null,
    window,
  };
}

async function openShop(index, rules) {
  const merchant = actor();
  const email = `fuzz-${run}-${index}@example.com`;
  // There is no sign-up: every shop is an approved application.
  await openApprovedShop({
    admin: operator,
    merchant,
    name: `Fuzz Shop ${run}-${index}`,
    email,
    ownerName: `Fuzz Owner ${index}`,
  });

  const programs = await merchant.call("/business/programs");
  const program = programs.body.find((p) => p.status === "Live" && p.type === "Stamps");
  if (!program) throw new Error("onboarding left no live stamp card");

  // `window` labels the scenario for this suite; the API takes startsAt and
  // endsAt, so it is left out of the body rather than destructured away.
  const patch = Object.fromEntries(Object.entries(rules).filter(([key]) => key !== "window"));
  const saved = await merchant.call(`/business/programs/${program.id}`, {
    method: "PATCH",
    body: { ...patch, target: rules.target },
  });
  if (saved.status !== 200) throw new Error(`rules: ${saved.status} ${saved.text.slice(0, 120)}`);

  return { merchant, programId: program.id, saved: saved.body.rules, plan: "Launch" };
}

/* ── the model ───────────────────────────────────────────────────────── */

/**
 * What the rules say a visit should do, given everything before it.
 * Deliberately written from the product's promises rather than from the
 * implementation, so the two can disagree.
 */
function predict(rules, state, amountCentavos) {
  if (rules.window === "future") return { earn: false, refuse: true, why: "not started" };
  if (rules.window === "past") return { earn: false, refuse: true, why: "run ended" };
  if (state.completed) return { earn: false, refuse: false, why: "card complete for this run" };
  // Cooldown before minimum spend, which is the order the counter is told
  // them in: somebody already stamped today earns nothing however much they
  // spend, so "come back tomorrow" is the true answer and "spend more" would
  // be a lie. The model had these the other way round and disagreed with the
  // API on every card that set both.
  if (state.stampedThisWindow && rules.cooldownMinutes > 0) {
    return { earn: false, refuse: true, why: "cooldown" };
  }
  if (rules.minSpendCentavos > 0 && amountCentavos < rules.minSpendCentavos) {
    return { earn: false, refuse: false, why: "under the minimum spend" };
  }
  return { earn: true, refuse: false, why: "" };
}

/* ── one scenario, start to finish ───────────────────────────────────── */

async function exercise(index) {
  const rules = inventRules();
  const label = `shop ${index} [target ${rules.target}, welcome ${rules.welcomeStamp ? "on" : "off"}, cooldown ${rules.cooldownMinutes}m, min ₱${rules.minSpendCentavos / 100}, expiry ${rules.expiryDays}d, cap ${rules.maxCompletions || "none"}, window ${rules.window}]`;
  notes.push(label);

  const { merchant, programId, saved } = await openShop(index, rules);

  // Every rule that went in comes back out. A knob that silently does not
  // persist is the cheapest bug in this whole file to miss. `target` lives on
  // the program itself rather than in its rules object, so it is checked
  // against the balance endpoint further down.
  for (const key of ["welcomeStamp", "cooldownMinutes", "minSpendCentavos", "expiryDays", "maxCompletions"]) {
    expect(`${label} :: ${key} persists`, saved[key] === rules[key], `sent ${rules[key]}, got ${saved[key]}`);
  }

  const person = await merchant.call("/customers", {
    method: "POST",
    body: { name: `Fuzz Regular ${index}`, mobile: mobile() },
  });
  if (person.status !== 201) {
    failures.push(`${label} :: could not add a customer — ${person.status} ${person.text.slice(0, 80)}`);
    return;
  }
  const customerId = person.body.id;

  // 13 digits, check digit and all, on every plan.
  expect(
    `${label} :: member code is a scannable 13 digits`,
    /^\d{13}$/.test(person.body.memberCode ?? ""),
    person.body.memberCode,
  );

  const state = { balance: 0, rewards: 0, completions: 0, completed: false, stampedThisWindow: false, welcomeSpent: false };
  const visits = between(rules.target + 2, rules.target * 2 + 4);

  for (let visit = 0; visit < visits; visit += 1) {
    // Amounts straddle the minimum, so both sides of the rule get exercised.
    const amount = pick([1_000, 3_000, 5_000, 9_900, 10_000, 12_000, 30_000]);
    const predicted = predict(rules, state, amount);

    const result = await merchant.call("/transactions", {
      method: "POST",
      headers: { "Idempotency-Key": `fuzz_${run}_${index}_${visit}` },
      body: { customerId, amountCentavos: amount },
    });

    if (predicted.refuse) {
      expect(
        `${label} :: visit ${visit} refused (${predicted.why})`,
        result.status === 409,
        `HTTP ${result.status} ${result.text.slice(0, 70)}`,
      );
      if (result.status === 409 && predicted.why === "cooldown") {
        expect(`${label} :: cooldown refusal names the next time`, Boolean(result.body?.nextStampAt));
      }
      if (result.status === 409 && predicted.why !== "cooldown") {
        expect(
          `${label} :: window refusal explains itself`,
          Boolean(result.body?.reason || result.body?.detail || result.body?.startsAt || result.body?.endsAt),
          JSON.stringify(result.body ?? {}).slice(0, 80),
        );
      }
      continue;
    }

    if (result.status !== 201) {
      failures.push(`${label} :: visit ${visit} answered ${result.status} ${result.text.slice(0, 80)}`);
      if (process.env.TRACE) console.log(`    TRACE visit ${visit} amount ${amount} predicted ${JSON.stringify(predicted)} model balance ${state.balance} window ${state.stampedThisWindow}`);
      continue;
    }

    const moved = result.body.stampsAfter - state.balance;

    if (!predicted.earn) {
      expect(
        `${label} :: visit ${visit} recorded but earns nothing (${predicted.why})`,
        result.body.earned === false,
        `earned=${result.body.earned}`,
      );
      expect(
        `${label} :: and says why`,
        Boolean(result.body.reason),
        JSON.stringify(result.body).slice(0, 90),
      );
      // A visit that earns nothing can still write the welcome stamp: the
      // promise from the poster is confirmed by the first staff scan, not by
      // the first scan large enough to earn. That entry is a stamp like any
      // other, so it starts the cooldown - which is why the model has to
      // notice it here rather than only on the earning path.
      expect(
        `${label} :: a visit that earns nothing moves nothing`,
        moved === 0,
        `balance went ${state.balance} -> ${result.body.stampsAfter}`,
      );
      continue;
    }

    // A walk-in the counter creates never carries a welcome stamp: that is a
    // promise the poster makes to somebody who joins from it, so every visit
    // here is worth exactly one. The suite proves that rather than assuming
    // it - a two-step would mean a welcome stamp granted to a person who
    // never scanned a poster.
    expect(
      `${label} :: visit ${visit} is worth exactly one stamp`,
      moved === 1,
      `balance went ${state.balance} -> ${result.body.stampsAfter}`,
    );
    expect(
      `${label} :: a counter walk-in is given no welcome stamp`,
      result.body.welcomeStampConfirmed !== true,
      `welcome confirmed for a customer who never scanned a poster`,
    );
    state.balance = result.body.stampsAfter;
    state.stampedThisWindow = rules.cooldownMinutes > 0;

    // The units that bought a reward stay in the ledger until it is spent, so
    // a card left unclaimed still reads as full and the next payout is
    // another whole target away. Rewards are never claimed in this run, so
    // the count owed is simply how many targets the balance covers - capped.
    const owed = Math.floor(state.balance / rules.target);
    const allowed = rules.maxCompletions > 0 ? Math.min(owed, rules.maxCompletions) : owed;
    if (allowed > state.rewards) {
      expect(
        `${label} :: crossing ${allowed * rules.target} earned reward ${allowed}`,
        Boolean(result.body.rewardEarned),
        `balance ${state.balance}, target ${rules.target}`,
      );
      state.rewards = allowed;
      if (rules.maxCompletions > 0 && state.rewards >= rules.maxCompletions) state.completed = true;
    } else {
      expect(
        `${label} :: visit ${visit} earned no reward it was not owed`,
        !result.body.rewardEarned,
        `balance ${state.balance}, already ${state.rewards} of cap ${rules.maxCompletions || "none"}`,
      );
    }
  }

  // ── invariants that hold however the visits fell ──────────────────────
  const balance = await merchant.call(`/customers/${customerId}/balance`);
  if (balance.status === 200) {
    expect(`${label} :: balance is never negative`, balance.body.balance >= 0, `${balance.body.balance}`);
    expect(
      `${label} :: the card's target is the one that was set`,
      balance.body.target === rules.target,
      `${balance.body.target}`,
    );
  }

  const rewards = await merchant.call(`/customers/${customerId}/rewards`);
  const held = (Array.isArray(rewards.body) ? rewards.body : (rewards.body?.items ?? [])).filter(
    (r) => !r.redeemedAt,
  );
  if (rules.maxCompletions > 0) {
    expect(
      `${label} :: never more rewards than the cap allows`,
      held.length <= rules.maxCompletions,
      `${held.length} held against a cap of ${rules.maxCompletions}`,
    );
  }
  expect(
    `${label} :: every reward the model owes is held, none spent`,
    held.length === state.rewards,
    `model ${state.rewards}, api ${held.length}`,
  );

  return {
    merchant,
    customerId,
    rules,
    label,
    heldRewards: held.length,
    programId,
    balance: balance.status === 200 ? balance.body.balance : null,
  };
}

/**
 * Stamp expiry, on a clock that has moved.
 *
 * `expire_stamps` takes the moment to judge against, which is how the nightly
 * job is scheduled and how it can be tested without waiting a year. Units a
 * held reward is standing on do not expire - the shop already owes that
 * reward - so what should survive is exactly one target per unclaimed reward.
 */
async function checkExpiry(scenarios, reservedFor) {
  const aging = scenarios.filter((s) => s.rules.expiryDays > 0 && s.balance);
  if (!aging.length) {
    notes.push("no shop in this run had an expiry set — that path not exercised");
    return;
  }
  const furthest = Math.max(...aging.map((s) => s.rules.expiryDays)) + 2;
  const { execSync } = await import("node:child_process");
  let jobOutput = "";
  try {
    // A committed script rather than an inline blob: multi-line python
    // through execSync on Windows goes to cmd.exe, which mangles it into
    // silence - the job appeared to run and reported nothing.
    jobOutput = execSync(
      `docker compose -f compose.backend.yaml exec -T api python scripts/advance_clock.py ${furthest}`,
      { cwd: "../backend", stdio: "pipe", encoding: "utf8" },
    );
    notes.push(`  clock +${furthest}d — ${jobOutput.trim().split(/\r?\n/).pop()}`);
  } catch (error) {
    failures.push(`the ageing jobs would not run — ${String(error).split("\n")[0].slice(0, 140)}`);
    return;
  }
  for (const shop of aging) {
    const after = await shop.merchant.call(`/customers/${shop.customerId}/balance`);
    if (after.status !== 200) {
      failures.push(`${shop.label} :: balance unreadable after expiry (${after.status})`);
      continue;
    }
    // The clock has moved past this card's whole term, and the same term
    // ages an unclaimed reward as ages a loose stamp. So the reward goes
    // first, its stamps stop being held the moment it does, and the card is
    // left empty. A held reward only shields its stamps while it is itself
    // still alive - which is the part worth checking, because "your stamps
    // are safe, the reward is holding them" stops being true on the day the
    // reward expires.
    const rewards = await shop.merchant.call(`/customers/${shop.customerId}/rewards`);
    const rows = Array.isArray(rewards.body) ? rewards.body : (rewards.body?.items ?? []);
    const stillHeld = rows.filter((r) => !r.redeemedAt && r.status !== "expired").length;
    notes.push(
      `  expiry: ${shop.rules.expiryDays}d term, ${shop.balance} stamps -> ${after.body.balance}, ${shop.heldRewards} reward(s) -> ${stillHeld}`,
    );
    // A reward already reserved for somebody at the counter is not swept up
    // by the night's ageing - it is mid-transaction, and a reward that
    // evaporated while staff were handing it over would be the worst
    // possible moment to lose one. Its stamps stay held with it.
    const reserving = shop.customerId === reservedFor;
    if (reserving) {
      expect(
        `${shop.label} :: a reserved reward survives the sweep, and keeps its stamps`,
        stillHeld >= 1 && after.body.balance >= shop.rules.target,
        `${stillHeld} held, balance ${after.body.balance}, target ${shop.rules.target}`,
      );
    } else {
      expect(
        `${shop.label} :: past its ${shop.rules.expiryDays}-day term the card is empty`,
        after.body.balance === 0,
        `was ${shop.balance}, got ${after.body.balance}`,
      );
      expect(
        `${shop.label} :: and an unclaimed reward did not outlive the stamps that bought it`,
        stillHeld === 0,
        `${stillHeld} still held`,
      );
    }
  }
}

/* ── the run ─────────────────────────────────────────────────────────── */

console.log(`\nseed ${SEED}   shops ${SHOPS}   (SEED=${SEED} replays this exactly)\n`);

const scenarios = [];
// The platform admin who approves every shop the scenarios open.
const operator = actor();
await signInAdmin(operator);

for (let index = 0; index < SHOPS; index += 1) {
  try {
    const outcome = await exercise(index);
    if (outcome) scenarios.push(outcome);
  } catch (error) {
    failures.push(`shop ${index} threw — ${String(error).split("\n")[0].slice(0, 140)}`);
  }
}

/* Plan gates, on a shop that exists rather than a fixture. Launch is what all
   of these are on, so every paid lever must refuse. */
const anyShop = scenarios[0];
if (anyShop) {
  const today = new Date().toISOString().slice(0, 10);
  const paid = [
    ["/business/bonus-windows", { name: "Fuzz", multiplier: 2, fromHour: 9, toHour: 17, startsOn: today }],
    ["/business/promo-codes", { code: `FUZZ${run}`, kind: "stamps", value: 1 }],
    ["/business/store-credit", { customerId: anyShop.customerId, amountCentavos: 1_000, reason: "fuzz" }],
    ["/business/campaigns", { name: "Fuzz", audience: "Everyone", channels: ["email"] }],
  ];
  for (const [path, body] of paid) {
    const answer = await anyShop.merchant.call(path, { method: "POST", body });
    if (answer.status === 404) continue;
    expect(
      `free plan refuses ${path}`,
      [402, 403].includes(answer.status),
      `HTTP ${answer.status} ${answer.text.slice(0, 60)}`,
    );
  }
  // A second live card is one too many on the free plan - but only while the
  // first is still running. A card whose run has ended does not count, on
  // purpose: otherwise a Launch shop could never switch on the successor its
  // closing card carries over to, which is the whole point of carry-over.
  const second = await anyShop.merchant.call("/business/programs", {
    method: "POST",
    body: { type: "Stamps", name: "Second", status: "Live", target: 6, rewardName: "Another" },
  });
  if (anyShop.rules.window === "past") {
    expect(
      "a closed run frees the slot for its successor",
      second.status === 201,
      `HTTP ${second.status} — a Launch shop could not replace a card whose run ended`,
    );
  } else {
    expect(
      "free plan runs one live program at a time",
      [402, 409].includes(second.status),
      `HTTP ${second.status}`,
    );
  }
}

/* One shop taken all the way through a redemption, since that path needs a
   customer session and is the same regardless of the card's numbers. */
let reservedFor = null;
const spender = scenarios.find((s) => s.heldRewards > 0);
if (spender) {
  const reserved = await spender.merchant.call("/redemptions/reserve", {
    method: "POST",
    headers: { "Idempotency-Key": `fuzz_${run}_redeem` },
    body: { customerId: spender.customerId },
  });
  expect("a held reward can be reserved", reserved.status === 201, `HTTP ${reserved.status}`);
  if (reserved.status === 201) reservedFor = spender.customerId;
  if (reserved.status === 201) {
    expect(
      "reserving waits for the customer",
      /await/i.test(reserved.body.status ?? ""),
      reserved.body.status,
    );
    const early = await spender.merchant.call(`/redemptions/${reserved.body.id}/commit`, { method: "POST" });
    expect("the counter cannot commit before the customer approves", early.status === 409, `HTTP ${early.status}`);
  }
} else {
  notes.push("no shop earned a reward this run — redemption path not exercised");
}

/* ── the customer's own view ─────────────────────────────────────────── */

/**
 * The half a merchant never sees. A shop whose card the counter has been
 * stamping must show the same numbers in the wallet, to the person whose
 * card it is - reached through a real one-time code, because that is the
 * only way in.
 */
const walletShop = scenarios.find((s) => s.balance > 0);
if (walletShop) {
  const list = await walletShop.merchant.call("/business/customers?limit=100");
  const rows = Array.isArray(list.body) ? list.body : (list.body?.items ?? []);
  const mine = rows.find((r) => r.id === walletShop.customerId);
  expect("the stamped customer is on the shop's own list", Boolean(mine), `${rows.length} rows`);

  const customer = actor();
  const number = mine?.mobile ?? null;
  if (number) {
    const asked = await customer.call("/auth/otp/request", { method: "POST", body: { identifier: number } });
    expect("a code can be requested for a counter-created member", asked.status === 200, `HTTP ${asked.status}`);
    const sink = await customer.call("/_dev/messages?purpose=otp&limit=20");
    const tail = number.slice(-9);
    const mineMsgs = (sink.body ?? []).filter((m) => (m.to ?? m.destination ?? "").includes(tail));
    const code = (mineMsgs.length ? mineMsgs : (sink.body ?? []))
      .map((m) => /\b\d{6}\b/.exec(m.body ?? "")?.[0])
      .find(Boolean);
    if (code) {
      const wrong = await customer.call("/auth/otp/verify", {
        method: "POST",
        body: { identifier: number, code: code === "000000" ? "111111" : "000000" },
      });
      expect("a wrong code is refused", wrong.status >= 400, `HTTP ${wrong.status}`);
      const verified = await customer.call("/auth/otp/verify", {
        method: "POST",
        body: { identifier: number, code },
      });
      expect("the right code opens the wallet", verified.status === 200, `HTTP ${verified.status}`);

      if (verified.status === 200) {
        const wallet = await customer.call("/customer/wallet");
        const cards = wallet.body?.cards ?? wallet.body ?? [];
        const card = cards.find((c) => c.programId === walletShop.programId);
        expect("the shop's card is in the customer's wallet", Boolean(card), `${cards.length} card(s)`);
        if (card) {
          // The counter and the wallet must never disagree about a number the
          // customer can see.
          expect(
            "the wallet shows the same progress as the counter",
            card.progress === walletShop.balance,
            `counter ${walletShop.balance}, wallet ${card.progress}`,
          );
          expect(
            "and the same target",
            card.target === walletShop.rules.target,
            `${card.target} vs ${walletShop.rules.target}`,
          );
        }
        const activity = await customer.call("/customer/activity?limit=100");
        const entries = Array.isArray(activity.body) ? activity.body : (activity.body?.items ?? []);
        expect("their own history is readable", entries.length > 0, `${entries.length} entries`);
        const profile = await customer.call("/customer/profile");
        expect(
          "their member code is 13 digits",
          /^\d{13}$/.test(profile.body?.memberCode ?? ""),
          profile.body?.memberCode,
        );
      }
    } else {
      notes.push("no one-time code reached the sink — wallet half not exercised");
    }
  }
}

/* ── the platform administrator ──────────────────────────────────────── */

const admin = actor();
const signedIn = await admin.call("/auth/login", {
  method: "POST",
  body: { email: "admin@kyprewards.com", password: "DemoPass123!" },
});
if (signedIn.status === 200) {
  await admin.call("/auth/mfa/verify", {
    method: "POST",
    body: { code: await freshTotp("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP") },
  });

  const flags = await admin.call("/admin/flags");
  const flagRows = Array.isArray(flags.body) ? flags.body : (flags.body?.items ?? []);
  for (const key of ["billing.paid_tiers", "billing.credit_purchases"]) {
    const row = flagRows.find((f) => (f.id ?? f.key) === key);
    expect(`the beta keeps ${key} off`, row?.enabled === false, `${row?.enabled}`);
  }

  const tenants = await admin.call("/admin/tenants?limit=200");
  const tenantRows = Array.isArray(tenants.body) ? tenants.body : (tenants.body?.items ?? []);
  const mineListed = tenantRows.filter((t) => (t.name ?? t.businessName ?? "").includes(`Fuzz Shop ${run}`));
  expect(
    "every shop this run created is visible to the platform",
    mineListed.length === scenarios.length,
    `made ${scenarios.length}, admin sees ${mineListed.length}`,
  );
  expect(
    "and all of them on Launch",
    mineListed.every((t) => !t.plan || t.plan === "Launch"),
    mineListed.map((t) => t.plan).join(","),
  );

  for (const path of ["/admin/partner-applications?limit=5", "/admin/support?limit=5", "/admin/audit?limit=5"]) {
    const answer = await admin.call(path);
    expect(`the console can read ${path.split("?")[0]}`, answer.status === 200, `HTTP ${answer.status}`);
  }
} else {
  notes.push(`admin sign-in unavailable (HTTP ${signedIn.status}) — platform half not exercised`);
}


await checkExpiry(scenarios, reservedFor);

console.log("scenarios");
for (const line of notes) console.log("  " + line);
console.log(`\n${checks} checks, ${failures.length} failure(s)`);
for (const line of failures.slice(0, 40)) console.log("  FAIL " + line);
if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
process.exit(failures.length ? 1 : 0);
