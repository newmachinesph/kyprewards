/**
 * Preview mode: how a screen renders a feature the API does not serve yet.
 *
 * Decided 2026-09-04. The frontend is built to the contract ahead of the
 * backend so the whole product can be seen. Locally, with
 * `NEXT_PUBLIC_PREVIEW_UNBUILT=true`, a hook whose endpoint answers 404, 405
 * or 501 renders typed sample data instead, and every sample row carries
 * `preview: true` so the screen can badge it "Preview, not connected" and
 * disable the writes beside it. In production the flag is unset and those
 * screens show their honest empty or error state. Nothing ever reports a
 * success the API did not produce.
 *
 * Only wrap an endpoint that does not exist. A 404 from an endpoint that
 * exists means the resource is missing, and swapping sample data in for it
 * would hide a real answer.
 */

import { ApiError } from "./errors.ts";

/** Every sample object carries this; real rows never do. */
export type Previewable = { preview?: boolean };

/** Read per call so Next inlines it wherever it appears. */
export const previewEnabled = (): boolean => process.env.NEXT_PUBLIC_PREVIEW_UNBUILT === "true";

const MISSING_ENDPOINT = new Set([404, 405, 501]);

export function isMissingEndpoint(error: unknown): boolean {
  return error instanceof ApiError && MISSING_ENDPOINT.has(error.status);
}

/**
 * A query function for an endpoint that is not built yet.
 *
 * Calls the API first, always: the moment the backend ships the route the
 * sample stops rendering without a frontend change.
 */
export function withPreview<T>(fetch: () => Promise<T>, sample: () => T): () => Promise<T> {
  return async () => {
    try {
      return await fetch();
    } catch (error) {
      if (previewEnabled() && isMissingEndpoint(error)) return sample();
      throw error;
    }
  };
}

/**
 * For a list the API already serves: append sample rows that show states
 * the backend cannot produce yet (a pending welcome stamp, a closed run).
 * The real rows come first and are untouched.
 */
export function withPreviewExtras<T>(
  fetch: () => Promise<T[]>,
  extras: () => T[],
): () => Promise<T[]> {
  return async () => {
    const rows = await fetch();
    return previewEnabled() ? [...rows, ...extras()] : rows;
  };
}

/** True for a sample row, an object with sample fields, or a list holding any. */
export function isPreview(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(isPreview);
  return Boolean(value && typeof value === "object" && (value as Previewable).preview);
}

/**
 * The one sentence a disabled write shows beside a preview. Screens use it
 * as the button's title and helper text rather than inventing their own.
 */
export const PREVIEW_WRITE_REASON = "Preview only. This opens when the API ships it.";
