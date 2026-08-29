/**
 * The transport, ready and deliberately unwired.
 *
 * `@stampr/demo-data`'s `api.ts` is still the seam every hook resolves
 * through, and it still returns the fixture. This file is what each of those
 * 31 accessor bodies becomes: one `http()` call. Nothing imports it yet, and
 * that is the point — the fetch layer is written, typed and tested before a
 * single screen depends on it, so integration is a body swap rather than a
 * design exercise under deadline.
 *
 * Everything here was derived from the live API, not from guesswork:
 * `backend/INTEGRATION.md` and `CONTRACT.md` for the envelope and headers,
 * and a run against the running stack for the parts documents get wrong.
 */

import { ApiError } from "@stampr/demo-data";

import { nextCursorFrom } from "./pagination";

export { ApiError };
export { nextCursorFrom };

/**
 * A single rejected field, from the 422 body.
 *
 * The API used to answer validation failures with Pydantic's raw list in
 * `detail`, which `ApiError` reads as a string — every form error reached the
 * user as "[object Object]". The backend now sends a readable `detail` plus
 * this array, so a form can mark the input that actually failed.
 */
export type FieldError = {
  /** Dot path to the field, as the client sent it: `name`, `tiers.0.target`. */
  field: string;
  message: string;
};

/** The documented error body. Every non-2xx answers in this shape. */
type ErrorBody = {
  detail?: string;
  errors?: FieldError[];
  requestId?: string;
};

/**
 * `ApiError` predates the `errors` array and its constructor is fixed by the
 * fixture package, so the field list rides alongside rather than inside it.
 * `fieldErrors(error)` is how a form gets at it without an `any`.
 */
const fieldErrorsByError = new WeakMap<ApiError, FieldError[]>();

/** The per-field failures behind a 422, or `[]` for every other error. */
export function fieldErrors(error: unknown): FieldError[] {
  return error instanceof ApiError ? (fieldErrorsByError.get(error) ?? []) : [];
}

/**
 * Empty in the browser so requests are same-origin through a rewrite; set to
 * the absolute API root when the apps and the API are on different hosts.
 *
 * `NEXT_PUBLIC_` values are inlined at build time — changing this after a
 * build does nothing to the deployed bundle.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export type HttpOptions = Omit<RequestInit, "body" | "method"> & {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Serialized as JSON. Pass `FormData` through `raw` instead. */
  body?: unknown;
  raw?: BodyInit;
  /**
   * Value for the `Idempotency-Key` header, format `<event>_<reference>`.
   * The API answers a replay with the original response, and a reuse with a
   * different payload with 409 — so a retried stamp cannot double-count.
   */
  idempotencyKey?: string;
  /** Appended to the path; `undefined` and `null` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
};

function withQuery(path: string, query: HttpOptions["query"]): string {
  if (!query) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

/**
 * One request, one place where a non-2xx becomes an `ApiError`.
 *
 * `credentials: "include"` is not optional. The session is an httpOnly
 * cookie, `fetch` omits cookies on cross-origin requests unless told
 * otherwise, and the failure mode is every authenticated call answering 401
 * with nothing in the network tab to explain why.
 */
export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", body, raw, idempotencyKey, query, headers, ...rest } = options;

  const response = await fetch(`${API_BASE}${withQuery(path, query)}`, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });

  if (!response.ok) throw await toApiError(response);

  // 204 on DELETE, and any empty body, must not reach `JSON.parse`.
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  // A gateway timeout or a proxy error is HTML, not our envelope. Falling
  // back to the status text keeps the thrown error readable instead of
  // turning a 502 into a JSON parse crash.
  const parsed = await response
    .json()
    .then((value) => value as ErrorBody)
    .catch(() => ({}) as ErrorBody);

  const error = new ApiError(
    parsed.detail ?? response.statusText ?? "Request failed",
    response.status,
    parsed.requestId,
  );
  if (parsed.errors?.length) fieldErrorsByError.set(error, parsed.errors);
  return error;
}

/**
 * A page of a cursor-paginated list, with the two headers the API sends
 * alongside it.
 *
 * The list endpoints cap at 200 rows and return `X-Total-Count` plus a
 * `Link: …; rel="next"`. `useInfiniteQuery` wants the cursor, so the cursor
 * is extracted here rather than re-parsed at every call site.
 */
export type Page<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};

export async function httpPage<T>(path: string, options: HttpOptions = {}): Promise<Page<T>> {
  // A page read takes no body and no idempotency key, so the request is built
  // from the `RequestInit` members explicitly rather than by spreading
  // `options` and hoping this module's own fields do not reach `fetch`.
  const { method = "GET", query, headers, signal, cache, mode, redirect } = options;

  const response = await fetch(`${API_BASE}${withQuery(path, query)}`, {
    method,
    credentials: "include",
    headers: { ...headers },
    signal,
    cache,
    mode,
    redirect,
  });

  if (!response.ok) throw await toApiError(response);

  return {
    items: (await response.json()) as T[],
    total: Number(response.headers.get("X-Total-Count") ?? 0),
    nextCursor: nextCursorFrom(response.headers.get("Link")),
  };
}
