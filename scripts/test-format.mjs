/**
 * Checks for the shared formatters.
 *
 * These are the only pieces of real logic in `@stampr/ui/format` — a date
 * rollover, a rounding rule, and a relative-time ladder — and all three
 * previously lived inline in views as hardcoded strings that quietly aged.
 * Run with `npm run test:format`.
 */

import assert from "node:assert/strict";
import {
  daysUntilBirthday,
  greeting,
  peso,
  pesoCompact,
  pesoFromCentavos,
  relativeTime,
} from "../packages/ui/src/format.ts";

/* ── Money ────────────────────────────────────────────────────────── */

assert.equal(peso(8120), "₱8,120");
assert.equal(peso(0), "₱0");
assert.equal(peso(0.95, { decimals: true }), "₱0.95");
assert.equal(peso(1290), "₱1,290");

// The contract sends centavos; the fixture stores pesos. Both are named.
assert.equal(pesoFromCentavos(28600), "₱286.00");
assert.equal(pesoFromCentavos(48500), "₱485.00");

assert.equal(pesoCompact(482600), "₱482.6k");
assert.equal(pesoCompact(136300), "₱136.3k");
assert.equal(pesoCompact(46000), "₱46k");
assert.equal(pesoCompact(318000), "₱318k", "a trailing .0 is dropped");
assert.equal(pesoCompact(940), "₱940");

/* ── Greeting ─────────────────────────────────────────────────────── */

const at = (hour) => new Date(2026, 7, 28, hour, 0, 0);
assert.equal(greeting(at(6)), "Good morning");
assert.equal(greeting(at(11)), "Good morning");
assert.equal(greeting(at(12)), "Good afternoon");
assert.equal(greeting(at(17)), "Good afternoon");
assert.equal(greeting(at(18)), "Good evening");
assert.equal(greeting(at(23)), "Good evening");

/* ── Relative time ────────────────────────────────────────────────── */

const now = new Date("2026-08-28T09:42:00+08:00");
assert.equal(relativeTime("2026-08-28T09:42:00+08:00", now), "Just now");
assert.equal(relativeTime("2026-08-28T09:24:00+08:00", now), "18 minutes ago");
assert.equal(relativeTime("2026-08-28T08:42:00+08:00", now), "1 hour ago");
assert.equal(relativeTime("2026-08-27T09:42:00+08:00", now), "Yesterday");
assert.equal(relativeTime("2026-08-25T09:42:00+08:00", now), "3 days ago");
assert.equal(relativeTime("not-a-date", now), "not-a-date");

/* ── Birthdays ────────────────────────────────────────────────────── */

const today = new Date(2026, 7, 28); // 28 August 2026

assert.equal(daysUntilBirthday("28 August", 30, today), 0, "today counts");
assert.equal(daysUntilBirthday("8 September", 30, today), 11);
assert.equal(daysUntilBirthday("22 November", 30, today), null, "outside window");

// The whole point: a birthday already past this year rolls to next year rather
// than reading as a large negative number, or being dropped entirely.
assert.equal(daysUntilBirthday("27 August", 30, today), null);
assert.equal(daysUntilBirthday("27 August", 400, today), 364);

// Year boundary.
const december = new Date(2026, 11, 28);
assert.equal(daysUntilBirthday("3 January", 30, december), 6);

assert.equal(daysUntilBirthday("not a date", 30, today), null);
assert.equal(daysUntilBirthday("8 Septembre", 30, today), null);

console.log("format checks passed");
