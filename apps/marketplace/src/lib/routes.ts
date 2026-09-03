/** Internal paths, in one place so a rename is one edit. */
export const categoryPath = (name: string) => `/categories/${encodeURIComponent(name)}`;
export const neighborhoodPath = (name: string) => `/neighborhoods/${encodeURIComponent(name)}`;
export const shopPath = (slug: string) => `/shops/${encodeURIComponent(slug)}`;

/** Next decodes route params already; this only guards a malformed escape. */
export function decodeParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
