/**
 * Cursor extraction, kept dependency-free.
 *
 * Its own module so it can be unit-tested in bare Node: `http.ts` reaches
 * `@kypstamping/demo-data` for `ApiError`, and that package imports the fixture
 * JSON, which only a bundler resolves. A pure parser should not need one.
 */

/** `<https://…?cursor=abc>; rel="next"` → `abc`. Null when it is the last page. */
export function nextCursorFrom(link: string | null): string | null {
  if (!link) return null;
  const next = link
    .split(",")
    .map((part) => part.trim())
    .find((part) => /rel\s*=\s*"?next"?/.test(part));
  if (!next) return null;

  const url = /<([^>]+)>/.exec(next)?.[1];
  if (!url) return null;
  // Relative in principle, absolute in practice; the base makes both parse.
  try {
    return new URL(url, "http://placeholder.invalid").searchParams.get("cursor");
  } catch {
    return null;
  }
}
