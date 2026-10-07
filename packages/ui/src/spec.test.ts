/**
 * The approved site facts that would regress silently, and the Sentry
 * defaults that keep personal data out. Run with `npm test -w @kyprewards/ui`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { addOns, featureMatrix, paymentMethods, paymentMethodsText } from "./plans.ts";
import { sentryOptions } from "./sentry.ts";

test("payment methods are what QR Ph actually takes", () => {
  assert.equal(paymentMethodsText, "GCash, Maya and bank apps through QR Ph");
  assert.doesNotMatch(paymentMethods.join(" "), /visa|mastercard|card|instapay|pesonet/i);
});

test("the SMS-from-your-own-phone row is gone from the matrix", () => {
  const labels = featureMatrix.flatMap((group) => group.rows.map((row) => row.label));
  assert.ok(!labels.some((label) => /own phone/i.test(label)));
});

test("the two add-ons say how they are bought", () => {
  const detail = (name: string) => addOns.find((addOn) => addOn.name === name)?.detail ?? "";
  assert.match(detail("Setup with a person"), /^Requested from your dashboard and invoiced by KYP Rewards\./);
  assert.match(detail("Email top-up"), /^Opens with campaign email\./);
});

test("Sentry stays off without a DSN and collects no personal data", () => {
  assert.equal(sentryOptions.dsn, process.env.NEXT_PUBLIC_SENTRY_DSN || undefined);
  assert.deepEqual(sentryOptions.dataCollection, {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  });
  assert.equal(sentryOptions.tracesSampleRate, 0.1);
});
