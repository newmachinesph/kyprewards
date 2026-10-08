import assert from "node:assert/strict";
import { test } from "node:test";

import { earningLine } from "./format.ts";

test("earningLine words every mode the way a shopper reads it", () => {
  assert.equal(earningLine({ mode: "peso", rateBps: 100 }), "1 point for every ₱100");
  assert.equal(earningLine({ mode: "peso", rateBps: 10_000 }), "1 point per ₱1");
  assert.equal(earningLine({ mode: "peso", rateBps: 20_000 }), "2 points per ₱1");
  assert.equal(earningLine({ mode: "peso", rateBps: 300 }), "3 points for every ₱100");
  assert.equal(earningLine({ mode: "peso", rateBps: 5 }), "1 point for every ₱2,000");
  assert.equal(earningLine({ mode: "visit", rateBps: 10_000 }), "1 point every visit");
  assert.equal(earningLine({ mode: "visit", rateBps: 50_000 }), "5 points every visit");
  assert.equal(earningLine({ mode: "item", rateBps: 5_000 }), "0.5 points per item");
  assert.equal(earningLine({ mode: "cashback", rateBps: 200 }), "2% back");
  assert.equal(earningLine({ mode: "cashback", rateBps: 250 }), "2.5% back");
  assert.equal(earningLine(null), null);
});
