/**
 * The data layer for all four apps.
 *
 * Three concerns, deliberately separated:
 *
 * - **Server state** — `queries.ts` and `mutations.ts`, cached by TanStack
 *   Query under the keys in `keys.ts`. Anything the API owns.
 * - **Client state** — `stores.ts`, zustand. Anything the API has never heard
 *   of: an open tab, a scanned-but-unsubmitted transaction.
 * - **Forms** — `forms.ts`, react-hook-form + zod, including the bridge that
 *   puts the API's own field errors back under the inputs that caused them.
 *
 * `http.ts` is the transport, written and tested but not yet wired: the read
 * hooks still resolve `@kypstamping/demo-data`'s fixture seam. Integration swaps
 * the bodies of that seam's 31 accessors and changes nothing here.
 */

export { ApiProvider } from "./provider";
export { getQueryClient, makeQueryClient } from "./query-client";
export { keys, type CustomerFilters, type Coordinates } from "./keys";
export * from "./queries";
export * from "./endpoints";
export * from "./types";
export {
  useApiMutation,
  useQueryClient,
  idempotencyKey,
  type ApiMutationOptions,
} from "./mutations";
export {
  ApiError,
  fieldErrors,
  http,
  httpPage,
  nextCursorFrom,
  apiBase,
  type FieldError,
  type HttpOptions,
  type Page,
} from "./http";
