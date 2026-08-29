/**
 * One QueryClient policy for all four apps.
 *
 * Server Components render on every request, so a client shared across
 * requests would leak one tenant's cache into another's page. `getQueryClient`
 * is the documented split: a fresh client per request on the server, one
 * cached client in the browser.
 */

import {
  QueryClient,
  defaultShouldDehydrateQuery,
  environmentManager,
} from "@tanstack/react-query";
import { ApiError } from "@kypstamping/demo-data";

/** Long enough that a tab switch does not re-fetch the whole workspace. */
const STALE_TIME = 60_000;

/**
 * A 4xx is the server saying the request was wrong. Retrying it produces the
 * same answer more slowly, and retrying a 401 delays the redirect to login by
 * three round trips. Only 408 and 429 are worth another attempt.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (!(error instanceof ApiError)) return true;
  if (error.status === 408 || error.status === 429) return true;
  return error.status >= 500;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        // The window regains focus constantly on a counter tablet. Refetching
        // every list each time is noise; the mutations that change them
        // already invalidate what they touched.
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        // A write that failed is the caller's to retry, deliberately. A stamp
        // replayed without its idempotency key is a second stamp.
        retry: false,
      },
      dehydrate: {
        // Stream queries that are still pending when the server flushes, so a
        // Server Component can start a fetch the client picks up mid-flight.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient();
  // Reused rather than re-made, so a suspend during the first render does not
  // throw away a cache the page has already started filling.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
