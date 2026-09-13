/**
 * The zod schemas, mirroring the API's Pydantic models.
 *
 * Split from `forms.ts` so they carry no dependency beyond zod: the
 * react-hook-form bridge next door reaches `http.ts` for the server's field
 * errors, and these have to stay testable without that chain.
 *
 * Two validations exist on purpose and they are not redundant. These run in
 * the browser so a typo is caught before a round trip; the API validates
 * again because a client is not a trust boundary. Where the two disagree the
 * server wins - which is what `applyApiErrors` is for.
 */

import { z } from "zod";

/* ── Shared primitives ────────────────────────────────────────────── */

/**
 * The API stores emails lowercased and trims them before comparing, so a
 * login typed with a capital first letter has to match one that was not.
 * Normalising here means the two sides agree without the user being told off
 * for a leading space.
 */
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/**
 * Philippine mobile, in the `+63` form the API stores. Accepts what people
 * actually type — `0917…`, `+63 917 555 0182`, `63917…` — and normalises,
 * because rejecting a number the user considers correct is a support ticket.
 */
export const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .transform((value) => {
    if (value.startsWith("+63")) return value;
    if (value.startsWith("63")) return `+${value}`;
    if (value.startsWith("09")) return `+63${value.slice(1)}`;
    return value;
  })
  .pipe(z.string().regex(/^\+639\d{9}$/, "Enter a mobile number like 0917 555 0182"));

/** Either identifier, for the screens that accept one field for both. */
export const emailOrPhone = z.union([email, phone], {
  error: "Enter an email address or mobile number",
});

/**
 * The API's own rule, restated so the user learns it before submitting rather
 * than from a 422.
 */
export const password = z
  .string()
  .min(12, "Use at least 12 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

/** Six digits, from an SMS the user is copying by hand. */
export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

/**
 * Money is centavos everywhere it crosses the wire — 43 fields of it — and a
 * float peso amount is how a bill ends up a centavo short. The input is pesos
 * because that is what a person types; the output is the integer the API
 * wants.
 */
export const pesosAsCentavos = z
  .number({ error: "Enter an amount" })
  .nonnegative("Amount cannot be negative")
  .transform((pesos) => Math.round(pesos * 100));

/* ── Auth ─────────────────────────────────────────────────────────── */

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({ identifier: emailOrPhone });
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({ identifier: emailOrPhone, code: otpCode });
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  // On the confirm field, not the form root, so the message lands under the
  // input the user has to change.
  .refine((values) => values.password === values.confirmPassword, {
    error: "Both passwords must match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ── Business workspace ───────────────────────────────────────────── */

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter the business name"),
  shortName: z.string().trim().min(2, "Enter a short name").max(24, "Keep this under 24 characters"),
  category: z.string().min(1, "Pick a category"),
  timezone: z.string().min(1),
  currency: z.string().length(3),
});
export type ProfileInput = z.infer<typeof profileSchema>;

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

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Name this branch"),
  address: z.string().trim().min(4, "Enter the street address"),
  city: z.string().trim().min(1, "Enter the city"),
  // Optional together: a branch either has coordinates for geofencing or it
  // has none. One without the other geofences the wrong place.
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  // Blank is a real answer: not every shop is on Google Maps. An address
  // describes where a shop is, this is what walks somebody to the door.
  mapsLink: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || isMapsLink(value),
      "That does not look like a Google Maps link.",
    ),
});
export type LocationInput = z.infer<typeof locationSchema>;

/** The eight the API supports; a merchant's plan decides which are offered. */
export const PROGRAM_TYPES = [
  "Stamps",
  "Points",
  "Discount",
  "Coupon",
  "Membership",
  "Rewards",
  "Multipass",
  // "Gift card", not "Gift". The picker offered a value the API does not
  // accept, so choosing it always failed with "Gift is not a program type" -
  // a dead option on every plan, including the ones that pay for it.
  "Gift card",
] as const;

/**
 * The lowest plan that may run each program type.
 *
 * Mirrors `programs.PLAN_PROGRAMS` on the API, which is what actually refuses
 * a publish. The onboarding wizard labelled its four choices and the Program
 * Studio dropdown listed all eight unmarked, so the same shop was told "needs
 * Core" on one screen and nothing at all on the other - and only found out at
 * "Publish new version", after filling the whole form in.
 */
export const PROGRAM_TYPE_MIN_PLAN: Record<(typeof PROGRAM_TYPES)[number], string> = {
  Stamps: "Launch",
  Points: "Core",
  Discount: "Core",
  Coupon: "Core",
  // All eight from Core: "Every format is included from the Core plan" on
  // the pricing page. Four of them sat at Grow here, against the page.
  Membership: "Core",
  Rewards: "Core",
  Multipass: "Core",
  "Gift card": "Core",
};

export const PLAN_RANK = ["Launch", "Core", "Grow", "Scale"];

export const programSchema = z.object({
  type: z.enum(PROGRAM_TYPES, { error: "Pick a program type" }),
  name: z.string().trim().min(2, "Name this program"),
  rewardName: z.string().trim().min(2, "Say what the customer earns"),
  // The published range on the pricing page. A 40-stamp card is a card
  // nobody finishes.
  target: z.number().int("Whole stamps only").min(1, "At least 1").max(30, "At most 30"),
});
export type ProgramInput = z.infer<typeof programSchema>;

/** The two a branch can be in. "Setup" hides it from customer discovery. */
export const LOCATION_STATUSES = ["Live", "Setup"] as const;

export const STAFF_ROLES = ["Owner", "Manager", "Supervisor", "Cashier", "Analyst"] as const;

export const staffInviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their name"),
  email,
  role: z.enum(STAFF_ROLES, { error: "Pick a role" }),
  location: z.string().min(1, "Pick a branch"),
});
export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

export const campaignSchema = z.object({
  name: z.string().trim().min(2, "Name this campaign"),
  audience: z.string().min(1, "Pick an audience"),
  channels: z.array(z.string()).min(1, "Pick at least one channel"),
  scheduledFor: z.string().datetime({ error: "Pick a send time" }).optional(),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const webhookEndpointSchema = z.object({
  // The API rejects plaintext outside sandbox and a browser cannot tell which
  // environment this is, so require TLS and let sandbox be the exception the
  // server makes.
  url: z.url({ error: "Enter a full URL" }).refine((value) => value.startsWith("https://"), {
    error: "Use an https:// URL",
  }),
  events: z.array(z.string()).min(1, "Subscribe to at least one event"),
});
export type WebhookEndpointInput = z.infer<typeof webhookEndpointSchema>;

/* ── Counter ──────────────────────────────────────────────────────── */

export const customerLookupSchema = z.object({ identifier: emailOrPhone });
export type CustomerLookupInput = z.infer<typeof customerLookupSchema>;

export const recordVisitSchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  amountCentavos: pesosAsCentavos.optional(),
});
export type RecordVisitInput = z.infer<typeof recordVisitSchema>;
