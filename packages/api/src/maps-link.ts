/**
 * The maps-link check on its own, with no zod behind it.
 *
 * The partner intake only needs this one function, and importing it through
 * `schemas.ts` pulled zod and every one of its locales into the /partners
 * page: about 400 KB for a regular expression.
 */

/**
 * Google hands out four different share formats. All of them are fine.
 *
 * The short `maps.app.goo.gl` one is what the mobile share sheet produces,
 * which is what a merchant standing in their own shop will paste.
 */
export const isMapsLink = (value: string) =>
  /^https?:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(
    value.trim(),
  );
