"use client";

/**
 * The provider every app's root layout wraps its tree in.
 *
 * `QueryClientProvider` reads context, so this file is a Client Component and
 * the layouts that use it stay Server Components.
 */

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getQueryClient } from "./query-client";

export function ApiProvider({ children }: { children: ReactNode }) {
  // Not `useState` — with no suspense boundary above this, React discards the
  // initial render's state when a child suspends, and a discarded client is a
  // discarded cache. `getQueryClient` holds the browser instance instead.
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
