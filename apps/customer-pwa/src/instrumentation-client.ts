import { sentryDsn, sentryOptions } from "@kyprewards/ui/sentry";

// Browser errors. Loaded after the page, and only when a DSN is set, so the
// SDK never sits in front of first paint and is absent without one.
if (sentryDsn) {
  void import("@kyprewards/ui/sentry-client").then((Sentry) => Sentry.init(sentryOptions));
}
