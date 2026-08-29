/**
 * Forms: the schemas, the resolver, and the bridge from a rejected request
 * back to the input that caused it.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { fieldErrors } from "./http";

export { zodResolver };
export * from "./schemas";

/* ── Server errors, back into the form ────────────────────────────── */

/**
 * Put the API's per-field rejections under the inputs that caused them.
 *
 * The client cannot know every rule the server enforces — an email already
 * registered, a branch name taken, a plan that does not allow this program
 * type. Those only fail at the API, and without this they surface as a banner
 * saying something went wrong somewhere.
 *
 * Returns the errors it could not place, which is what the caller shows as a
 * form-level message. A field the server names but the form does not have
 * must not be dropped silently — that is an error the user can neither see
 * nor fix.
 *
 * ```ts
 * onError: (error) => {
 *   const unmatched = applyApiErrors(error, form.setError, form.getValues());
 *   if (unmatched.length) setBanner(unmatched.map((e) => e.message).join(". "));
 * }
 * ```
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  values: T,
): { field: string; message: string }[] {
  const unmatched: { field: string; message: string }[] = [];

  for (const item of fieldErrors(error)) {
    const path = matchField(item.field, values);
    if (path) {
      setError(path, { type: "server", message: item.message });
    } else {
      unmatched.push(item);
    }
  }

  return unmatched;
}

/**
 * The server's dot path against the form's own shape.
 *
 * Names line up in the common case. They stop lining up where the API's
 * naming and the form's differ, and setting an error on a field that does not
 * exist puts a message nowhere on screen — so an unmatched name is reported
 * rather than assumed.
 */
function matchField<T extends FieldValues>(field: string, values: T): Path<T> | null {
  if (!field) return null;
  if (field in values) return field as Path<T>;

  // `tiers.0.target` — walk it, because a nested field is still a real input.
  const segments = field.split(".");
  let cursor: unknown = values;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== "object") return null;
    if (!(segment in (cursor as Record<string, unknown>))) return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return field as Path<T>;
}
