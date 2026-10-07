import type { Instrumentation } from "next";
import { sentryDsn, sentryOptions } from "@kyprewards/ui/sentry";

// Server and edge errors. The SDK is imported only when a DSN is set, so a
// build without one carries no Sentry at runtime.
export async function register() {
  if (!sentryDsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init(sentryOptions);
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!sentryDsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
