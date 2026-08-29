/**
 * The parts of this package that are logic rather than wiring: the two
 * parsers and the normalising schemas. Run with `npm test -w @kypstamping/api`.
 *
 * The hooks are not tested here — they are one-line adapters over accessors
 * that already have their own fixture, and a test asserting `useQuery` calls
 * `useQuery` proves nothing.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { nextCursorFrom } from "./pagination.ts";
import { http } from "./http.ts";
import { applyApiErrors } from "./forms.ts";
import { email, otpCode, password, pesosAsCentavos, phone, programSchema } from "./schemas.ts";

/* ── Link header ──────────────────────────────────────────────────── */

test("nextCursorFrom pulls the cursor out of a next link", () => {
  const link = '<http://localhost:8000/api/v1/business/customers?limit=2&cursor=Y3VzXzEwMDI>; rel="next"';

  assert.equal(nextCursorFrom(link), "Y3VzXzEwMDI");
});

test("nextCursorFrom returns null on the last page", () => {
  assert.equal(nextCursorFrom(null), null);
  assert.equal(nextCursorFrom(""), null);
});

test("nextCursorFrom ignores rels that are not next", () => {
  const link = '<https://api.example/x?cursor=abc>; rel="prev", <https://api.example/y?cursor=def>; rel="next"';

  assert.equal(nextCursorFrom(link), "def");
});

test("nextCursorFrom survives a malformed header instead of throwing", () => {
  // A proxy that rewrites Link badly must not crash a list render.
  assert.equal(nextCursorFrom("garbage"), null);
  assert.equal(nextCursorFrom('<not a url>; rel="next"'), null);
});

/* ── Identifier normalising ───────────────────────────────────────── */

test("phone accepts the three forms people actually type", () => {
  for (const input of ["09175550182", "+639175550182", "+63 917 555 0182", "63917-555-0182"]) {
    assert.equal(phone.parse(input), "+639175550182", input);
  }
});

test("phone rejects a number that is not a PH mobile", () => {
  assert.equal(phone.safeParse("12345").success, false);
  assert.equal(phone.safeParse("+6329123456").success, false); // landline
});

test("email is trimmed and lowercased so it matches what the API stored", () => {
  assert.equal(email.parse("  Mara@SweetCrumbs.PH "), "mara@sweetcrumbs.ph");
});

test("otpCode takes exactly six digits", () => {
  assert.equal(otpCode.parse(" 266355 "), "266355");
  assert.equal(otpCode.safeParse("26635").success, false);
  assert.equal(otpCode.safeParse("2663555").success, false);
  assert.equal(otpCode.safeParse("abcdef").success, false);
});

test("password states each rule it enforces", () => {
  assert.equal(password.safeParse("short").success, false);
  assert.equal(password.safeParse("alllowercase123").success, false);
  assert.equal(password.safeParse("NoDigitsInHere").success, false);
  assert.equal(password.safeParse("DemoPassword123").success, true);
});

/* ── Money ────────────────────────────────────────────────────────── */

test("pesosAsCentavos converts to the integer unit the API wants", () => {
  assert.equal(pesosAsCentavos.parse(250), 25000);
  assert.equal(pesosAsCentavos.parse(0), 0);
});

test("pesosAsCentavos rounds rather than truncating a fractional peso", () => {
  // 286.005 * 100 is 28600.499999999996 in binary floating point. Truncating
  // loses a centavo on amounts that look exact to the person typing them.
  assert.equal(pesosAsCentavos.parse(286.005), 28601);
  assert.equal(pesosAsCentavos.parse(0.1 + 0.2), 30);
});

test("pesosAsCentavos refuses a negative amount", () => {
  assert.equal(pesosAsCentavos.safeParse(-1).success, false);
});

/* ── Program rules ────────────────────────────────────────────────── */

test("programSchema holds the published 1-30 stamp range", () => {
  const valid = programSchema.safeParse({
    type: "Stamps",
    name: "Eight visits",
    rewardName: "Free pastry",
    target: 8,
  });
  assert.equal(valid.success, true);

  for (const target of [0, 31, 8.5]) {
    const result = programSchema.safeParse({
      type: "Stamps",
      name: "x y",
      rewardName: "a b",
      target,
    });
    assert.equal(result.success, false, `target ${target} should be rejected`);
  }
});

test("programSchema rejects a type the API does not have", () => {
  const result = programSchema.safeParse({
    type: "Tombola",
    name: "x y",
    rewardName: "a b",
    target: 8,
  });

  assert.equal(result.success, false);
});

/* ── Server errors, back onto the form ────────────────────────────────
   The bridge that makes the API's 422 useful. A rule only the server knows -
   an email already taken, a plan that forbids a program type - can only be
   shown under the right input if the refusal names the field and something
   carries it there. */

test("applyApiErrors puts a server refusal under the field that caused it", async () => {
  const marked: Array<[string, string]> = [];
  const failure = await refusal({
    detail: "target: must be between 1 and 30",
    errors: [{ field: "target", message: "must be between 1 and 30" }],
  });

  const unplaced = applyApiErrors(
    failure,
    ((name: string, error: { message?: string }) =>
      marked.push([name, error.message ?? ""])) as never,
    { name: "Eight visits", target: 31 },
  );

  assert.deepEqual(marked, [["target", "must be between 1 and 30"]]);
  assert.deepEqual(unplaced, []);
});

test("a field the form does not have is reported, not swallowed", async () => {
  // Otherwise the user sees nothing at all and cannot act: the message would
  // be attached to an input that does not exist.
  const marked: string[] = [];
  const failure = await refusal({
    detail: "plan: Grow does not include gift cards",
    errors: [{ field: "plan", message: "Grow does not include gift cards" }],
  });

  const unplaced = applyApiErrors(
    failure,
    ((name: string) => marked.push(name)) as never,
    { name: "Gift cards", target: 8 },
  );

  assert.deepEqual(marked, []);
  assert.deepEqual(unplaced, [
    { field: "plan", message: "Grow does not include gift cards" },
  ]);
});

test("a nested field path is walked rather than guessed", async () => {
  const marked: string[] = [];
  const failure = await refusal({
    detail: "tiers.0.target: too small",
    errors: [{ field: "tiers.0.target", message: "too small" }],
  });

  applyApiErrors(
    failure,
    ((name: string) => marked.push(name)) as never,
    { tiers: [{ target: 0 }] },
  );

  assert.deepEqual(marked, ["tiers.0.target"]);
});

test("an error with no field list places nothing", async () => {
  const marked: string[] = [];
  const failure = await refusal({ detail: "Something went wrong on our side" });

  const unplaced = applyApiErrors(
    failure,
    ((name: string) => marked.push(name)) as never,
    { name: "" },
  );

  assert.deepEqual(marked, []);
  assert.deepEqual(unplaced, []);
});

/** An ApiError as `http()` builds one, so the field list rides along with it. */
async function refusal(body: unknown) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  try {
    await http("/business/programs", { method: "POST", body: {} });
    throw new Error("expected the request to be refused");
  } catch (failure) {
    return failure;
  } finally {
    globalThis.fetch = realFetch;
  }
}
