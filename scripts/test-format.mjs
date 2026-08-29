/**
 * Checks for the shared formatters.
 *
 * These are the only pieces of real logic in `@kypstamping/ui/format` — a date
 * rollover, a rounding rule, and a relative-time ladder — and all three
 * previously lived inline in views as hardcoded strings that quietly aged.
 * Run with `npm run test:format`.
 */

import assert from "node:assert/strict";
import {
  daysUntilBirthday,
  formatDistance,
  greeting,
  peso,
  pesoCompact,
  pesoCompactFromCentavos,
  pesoFromCentavos,
  relativeTime,
  longDate,
  timeOfDay,
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


/* ── Dates the API sends ──────────────────────────────────────────────
   The API answers with `2026-09-15` and ISO instants, never display copy.
   These are what turn one into the other, so the twin fields the fixture
   used to carry - renewal beside renewalIso - are not needed. */

assert.equal(longDate("2026-09-15"), "15 September 2026");

// A bare date must not shift a day. `new Date("2026-09-15")` parses as UTC
// midnight, which in any timezone behind UTC prints as the 14th.
assert.equal(longDate("2026-01-01"), "1 January 2026");
assert.equal(longDate("2026-12-31"), "31 December 2026");

// A full instant is accepted too, so a caller does not have to know which
// of the two shapes a field carries.
assert.equal(longDate("2026-09-15T09:42:00+08:00"), "15 September 2026");

// Unparseable input is returned untouched rather than rendered "Invalid Date".
assert.equal(longDate("not a date"), "not a date");
assert.equal(longDate(""), "");

assert.equal(timeOfDay("2026-08-28T09:42:00+08:00", "Asia/Manila"), "9:42 AM");
assert.equal(timeOfDay("2026-08-28T21:05:00+08:00", "Asia/Manila"), "9:05 PM");
assert.equal(timeOfDay("nope"), "nope");

/* ── Compact money, from the wire unit ────────────────────────────── */

// Every money field the API sends is centavos, so the compact form needs the
// same counterpart pesoFromCentavos already has - otherwise a headline stat
// reads 100x too high and nothing catches it.
assert.equal(pesoCompactFromCentavos(48260000), "₱482.6k");
assert.equal(pesoCompactFromCentavos(31800000), "₱318k");
// Under a thousand it stays whole. The compact form is for headline stats,
// where two decimal places are noise — that is the difference from
// pesoFromCentavos, which is exact because a line item has to add up.
assert.equal(pesoCompactFromCentavos(28600), "₱286");

// A staff member who was invited and never signed in has no last-active
// instant. The API sends null; one answer here beats a guard at every caller.
assert.equal(relativeTime(null), "Never");
assert.equal(relativeTime(undefined), "Never");
assert.equal(relativeTime(""), "Never");

/* ── Distance ─────────────────────────────────────────────────────────
   Moved here from the API, which used to send "450 m" already formatted.
   A number is what the wallet can sort and the discover filter can compare;
   this is only the last step before it reaches a screen. */

assert.equal(formatDistance(450), "450 m");
assert.equal(formatDistance(1200), "1.2 km");
assert.equal(formatDistance(999), "1000 m");
assert.equal(formatDistance(1000), "1.0 km");
assert.equal(formatDistance(0), "0 m");

// No position, no distance - and nothing pretending otherwise.
assert.equal(formatDistance(null), "");

console.log("format checks passed");
