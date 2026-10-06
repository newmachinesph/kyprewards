/**
 * Sentry options shared by the five Next apps.
 *
 * The SDK is only ever imported dynamically, and only when a DSN is set: each
 * app's `instrumentation.ts` and `instrumentation-client.ts` do it at start,
 * `captureError` below does it from the error boundaries. No DSN, no Sentry:
 * local development and any project without the variable send nothing.
 *
 * kyp.ph and the wallet report to the kyp.ph project, the three
 * kyprewards.com apps to the kyprewards one; the DSN is set per Vercel
 * project, never written here.
 *
 * Personal data stays out: `dataCollection` is off for user info (so no IP
 * address), cookies, headers, HTTP bodies, query strings and stack-frame
 * variables. One trace in ten, no session replay, no source maps uploaded.
 * `satisfies` makes an option Sentry does not know a type error, so a renamed
 * option cannot silently stop working again.
 */
import type { init } from "@sentry/nextjs";

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;

export const sentryOptions = {
  dsn: sentryDsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || undefined,
  // Sentry 11 dropped sendDefaultPii; dataCollection is what keeps personal data out.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  },
  tracesSampleRate: 0.1,
} satisfies Parameters<typeof init>[0];

/**
 * Reports an error that an `error.tsx` or `global-error.tsx` boundary caught.
 * React does not rethrow those, so the SDK's global handlers never see them;
 * without this, the errors that blank a page would be the ones Sentry misses.
 */
export function captureError(error: unknown) {
  if (!sentryDsn) return;
  void import("./sentry-client").then((Sentry) => Sentry.captureException(error));
}
