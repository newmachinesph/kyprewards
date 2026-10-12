/**
 * The transport every request in the product goes through.
 *
 * It was written and tested before any screen depended on it, so integration
 * was a body swap rather than a design exercise under deadline. The fixture
 * seam it replaced is gone; `endpoints.ts` is the only caller.
 *
 * Everything here was derived from the live API, not from guesswork:
 * `backend/INTEGRATION.md` and `CONTRACT.md` for the envelope and headers,
 * and a run against the running stack for the parts documents get wrong.
 */

import { ApiError, NetworkError } from "./errors.ts";

import { nextCursorFrom } from "./pagination.ts";

export { ApiError, NetworkError };
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
 * The sign-up 409 for a number or email that already has a wallet, or null
 * for any other error. `detail` is the API's sentence; `via` is which of the
 * two it matched, so the screen can offer the matching sign-in and code.
 */
export function walletExists(
  error: unknown,
): { detail: string; via: "mobile" | "email" } | null {
  if (!(error instanceof ApiError) || error.body.code !== "wallet_exists") return null;
  return { detail: error.message, via: error.body.via === "email" ? "email" : "mobile" };
}

/**
 * The absolute API root, on the app's own site (api.kyprewards.com or
 * api.kyp.ph) so the session cookie stays first-party. No app rewrites to a
 * same-origin path; empty only resolves against the page's own origin.
 *
 * `NEXT_PUBLIC_` values are inlined at build time — changing this after a
 * build does nothing to the deployed bundle.
 */
export function apiBase(): string {
  // Read per call, not once at module load: Next inlines this expression
  // wherever it appears, so a function is just as bundler-friendly, and it
  // lets a test point the client at a stack without import-order games.
  //
  // The mobile app has no `NEXT_` variables at all; it sets the base
  // explicitly on boot.
  return configured.base ?? process.env.NEXT_PUBLIC_API_BASE ?? "";
}

/**
 * What a native app tells this transport that a browser never has to.
 *
 * The browser wallet's session is an httpOnly cookie, sent by the browser
 * and invisible to this code. The mobile app keeps the same token in the
 * device keychain and sends it as a bearer; the API accepts either. Nothing
 * here changes for the web apps, which never call these.
 */
const configured: { base: string | null; token: string | null; client: string | null } = {
  base: null,
  token: null,
  client: null,
};

export function setApiBase(base: string | null): void {
  configured.base = base;
}

export function setAuthToken(token: string | null): void {
  configured.token = token;
}

/** `"mobile"` makes the OTP verify answer with the session token in the body. */
export function setClientKind(client: string | null): void {
  configured.client = client;
}

function nativeHeaders(): Record<string, string> {
  return {
    ...(configured.token ? { Authorization: `Bearer ${configured.token}` } : {}),
    ...(configured.client ? { "X-KYP-Client": configured.client } : {}),
  };
}

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
 * `fetch`, with "no answer at all" turned into a `NetworkError` a screen can
 * show. A caller's own abort is not a failure to reach anyone, so it passes
 * through untouched for React Query to recognise.
 *
 * Exported for the CSV downloads, like `toApiError`.
 */
export async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (failure) {
    if (init.signal?.aborted) throw failure;
    throw new NetworkError(failure);
  }
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

  const response = await send(`${apiBase()}${withQuery(path, query)}`, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...nativeHeaders(),
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

/** Exported for the CSV downloads, which stream a file rather than JSON and
 *  so cannot go through `http()`. */
export async function toApiError(response: Response): Promise<ApiError> {
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
    parsed,
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

  const response = await send(`${apiBase()}${withQuery(path, query)}`, {
    method,
    credentials: "include",
    headers: { ...nativeHeaders(), ...headers },
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
