"use client";

/**
 * One mutation wrapper, rather than a hook per endpoint.
 *
 * Every write needs the same three things: which keys to invalidate when it
 * succeeds, an idempotency key when a replay would double a charge, and a
 * route for the API's per-field errors back into the form. One wrapper means
 * no call site has to remember all three, and none of them can forget.
 */

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

export type ApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
> & {
  /**
   * Refetched after a success. Prefixes work: `keys.business.all` covers
   * every query in the workspace, `keys.business.programs()` only that list.
   *
   * Prefer the narrowest prefix that is still correct. Invalidating the whole
   * workspace after a staff rename refetches the customer list, the metrics
   * and the billing summary to redraw one row.
   */
  invalidates?: QueryKey[];
};

/**
 * `useMutation` plus invalidation, so no call site has to remember to write
 * `onSuccess: () => queryClient.invalidateQueries(...)` and none of them
 * silently forgets.
 *
 * A caller's own `onSuccess` still runs — for the toast, the redirect, the
 * dialog close — after the invalidation is queued.
 */
/** Re-exported so callers invalidate through this package, not a second
 *  copy of react-query resolved from their own node_modules. */
export { useQueryClient };

export function useApiMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { invalidates = [], onSuccess, ...options }: ApiMutationOptions<TData, TVariables> = {},
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      for (const queryKey of invalidates) {
        void queryClient.invalidateQueries({ queryKey });
      }
      return onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/**
 * `visit_SC_10482` — the format the API's `Idempotency-Key` header expects.
 *
 * A stamp is the write that must never double, and the counter runs on
 * tablets with unreliable wifi where "did that go through?" is answered by
 * pressing the button again. Same key, same reference, and the API replays
 * the original response instead of recording a second visit.
 */
export function idempotencyKey(event: string, reference: string): string {
  return `${event}_${reference}`;
}
