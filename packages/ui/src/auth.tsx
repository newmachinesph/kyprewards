"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Croissant,
  Eye,
  EyeOff,
  Gift,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UserRoundPlus,
} from "lucide-react";
import {
  ApiError,
  getSession,
  login,
  logout,
  acceptInvite,
  registerCustomer,
  requestOtp,
  getInvite,
  requestPasswordReset,
  resetPassword,
  selectWorkspace,
  getWorkspaces,
  useSession,
  verifyMfa,
  verifyOtp,
  type InvitePreview,
  type Workspace,
} from "@kypstamping/api";
import Link from "next/link";
import { BrandMark, StampDots } from "./index";
import { displayMobile, normalizeMobile, toE164 } from "./format";

/*
 * The password and verification code that used to live here were checked in
 * the browser, which meant the "session" was a sessionStorage flag anyone
 * could set from the console. Every screen behind it read a fixture, so there
 * was nothing to protect - but the moment this points at a real API, a
 * client-side credential check is theatre.
 *
 * Sign-in is the API's answer now. The session is an httpOnly cookie this
 * code cannot read, which is the point: the gate below asks the server who
 * the visitor is rather than trusting a flag.
 */

/**
 * The identifier a customer asked for a code with.
 *
 * The verify screen is a separate route, and `POST /auth/otp/verify` needs
 * the destination as well as the code. Session storage rather than the URL:
 * a phone number in a query string ends up in browser history and logs.
 */
const OTP_IDENTIFIER_KEY = "kypstamping-otp-identifier";

/** Session storage does not change under us within a render, and there is no
 *  event to subscribe to, so the subscribe is a no-op and the server snapshot
 *  is the empty string. */
const subscribeToOtpIdentifier = () => () => {};

function readOtpIdentifier(): string | null {
  try {
    return window.sessionStorage.getItem(OTP_IDENTIFIER_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Null means "not known yet", which is not the same as "nowhere". Returning
 *  the empty string here made the server snapshot indistinguishable from a
 *  cold open, so the first paint of a perfectly normal sign-in flashed "We
 *  have lost track of where that code was sent." before settling. */
const noOtpIdentifierOnServer = () => null;

/** The shop whose first stamp is waiting to be claimed, written by the poster
 *  flow before it sends somebody here to register. Read the same way as the
 *  OTP destination: a client-only value with a server snapshot. */
const PENDING_CLAIM_SHOP_KEY = "kypstamping-pending-first-stamp-shop";
const subscribeToPendingShop = () => () => {};

function readPendingShop(): string {
  try {
    return window.localStorage.getItem(PENDING_CLAIM_SHOP_KEY) ?? "";
  } catch {
    return "";
  }
}

const noPendingShopOnServer = () => "";

/** Where the terms and privacy notice live. The four apps already agree on
 *  NEXT_PUBLIC_SITE_URL; the fallback is the production marketing site so a
 *  build without the variable still links somewhere real rather than to a
 *  relative path these apps do not serve. */
const marketingSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kypstamping.ph";

/**
 * Where a *shopper's* terms and privacy notice live.
 *
 * kypstamping.ph is the merchant side and its legal pages are written for
 * somebody running a shop: workspaces, staff accounts, billing. A person
 * joining a loyalty card is not that reader, and sending them there to agree
 * to it was asking for consent to the wrong document.
 */
const shopperSiteUrl =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? "https://kyp.ph";

export type DemoAuthRole = "business" | "admin" | "customer";
export type DemoAuthMode =
  | "login"
  | "forgot"
  | "reset"
  | "verify"
  | "create"
  | "workspaces"
  | "invite";

const roleConfig = {
  business: {
    label: "Business workspace",
    eyebrow: "Merchant access",
    identifierLabel: "Work email",
    identifierType: "email",
    identifier: "mara@sweetcrumbs.ph",
    signInTitle: "Welcome back to the counter.",
    signInDescription:
      "Sign in to manage customers, programs, campaigns, locations, and integrations.",
    // Was a receipt for the seeded demo bakery - "Workspace: Sweet Crumbs
    // Bakery, Role: Owner - all locations" - so the first thing a stranger
    // saw on our sign-in page was somebody else's account, for a business
    // that really is listed in Discover. These say what signing in does.
    steps: [
      ["Workspace", "Yours, and any you have been invited to"],
      ["Role", "Whatever your owner gave you"],
      ["Next", "Choose a workspace"],
    ],
  },
  admin: {
    label: "Platform control",
    eyebrow: "Restricted access",
    identifierLabel: "Administrator email",
    identifierType: "email",
    identifier: "admin@kypstamping.ph",
    signInTitle: "Enter the control room.",
    signInDescription:
      "Privileged sessions require a password and a second verification step.",
    steps: [
      ["Scope", "Platform operations"],
      ["Policy", "MFA required"],
      ["Audit", "Privileged actions recorded"],
    ],
  },
  customer: {
    label: "Customer wallet",
    eyebrow: "Passwordless access",
    identifierLabel: "Mobile number",
    identifierType: "tel",
    identifier: "+63 917 555 0182",
    signInTitle: "Open your wallet.",
    signInDescription:
      "Use your mobile number or email. We will send a one-time code—no password needed.",
    steps: [
      ["Member", "Your number, no password"],
      ["Wallet", "Every shop you have joined"],
      ["Privacy", "Permissions stay visible"],
    ],
  },
} as const;

function CustomerAuthVisual({
  mode,
  sentTo,
}: {
  mode: DemoAuthMode;
  /** Null while unknown, "" when this tab never asked for a code. */
  sentTo?: string | null;
}) {
  if (mode === "verify") {
    // On a cold open nothing was sent, so the badge does not say a code is
    // ready - it sat above "We have lost track of where that code was sent."
    const cold = sentTo === "";
    return (
      <div className="customer-auth-visual customer-auth-code-card">
        <span className="grid size-12 place-items-center rounded-xl bg-[var(--surface)] text-[var(--accent-strong)] shadow-sm">
          <Smartphone size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
            {cold ? "No code yet" : "Code ready"}
          </p>
          {/* It said "Sent to your mobile" on the email path too, so somebody
              who signed in with an address sat waiting for an SMS. The line
              under the input names the real destination; this one no longer
              contradicts it. */}
          <p className="mt-1 text-sm font-extrabold tracking-[-0.02em]">
            {cold ? "Start from sign-in" : "Check your messages"}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="size-1.5 rounded-full bg-[var(--ink)]" />
          ))}
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="customer-auth-visual customer-auth-create-card">
        <div className="flex -space-x-3" aria-hidden="true">
          {[Croissant, Gift, Sparkles].map((Icon, index) => (
            <span
              key={index}
              className={`grid size-12 place-items-center rounded-xl border-4 border-[var(--accent)] ${index === 1 ? "bg-[var(--ink)] text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--ink)]"}`}
            >
              <Icon size={19} />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[rgb(24_18_12/62%)]">
            One free wallet
          </p>
          <p className="mt-1 text-sm font-extrabold tracking-[-0.025em]">
            Rewards from every local favorite
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="loyalty-ticket customer-auth-loyalty-card overflow-hidden rounded-2xl px-5 py-5 text-[var(--paper)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
            <Croissant size={19} />
          </span>
          <div>
            {/* Named the seeded demo bakery, which is a real business in
                Discover, above a streak the visitor does not have. An
                illustration should not be mistakable for someone's card. */}
            <p className="text-sm font-extrabold tracking-[-0.025em]">Your local favourite</p>
            <p className="mt-0.5 text-[10px] font-semibold text-white/50">Closest reward</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink)]">
          <Sparkles size={11} /> 5-stamp streak
        </span>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <StampDots filled={5} total={8} dark />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
        <span className="text-white/50">3 visits to go</span>
        <span className="text-[var(--accent)]">Free pastry</span>
      </div>
    </article>
  );
}

function CustomerAuthShell({
  mode,
  title,
  description,
  children,
  sentTo,
}: {
  mode: DemoAuthMode;
  title: string;
  description: string;
  children: ReactNode;
  sentTo?: string | null;
}) {
  const stageLabel = mode === "verify" ? "Verify" : mode === "create" ? "Join KYP" : "Welcome back";

  return (
    <main className="customer-auth min-h-[100dvh] bg-[#d9d5ce] sm:px-5 sm:py-6">
      <section className="phone-shell relative mx-auto flex min-h-[100dvh] max-w-[460px] flex-col overflow-hidden border-x border-[rgb(24_18_12/8%)] bg-[var(--accent)] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[var(--radius-card)] sm:border sm:shadow-[0_28px_90px_rgb(24_18_12/20%)]">
        <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-[max(1.1rem,env(safe-area-inset-top))]">
          {/* Ink, not white: this header sits on the amber `--accent`, which
              is a light ground. White on it measures 2.16:1 and the default
              gold wordmark 2.80:1 - both below AA. Ink is 8.61:1. */}
          <BrandMark onAccent label="KYP" tagline="One card for every shop" />
        </header>

        <div className="px-5 pb-5">
          <CustomerAuthVisual mode={mode} sentTo={sentTo} />
        </div>

        <div className="customer-auth-sheet flex-1 rounded-t-[18px] bg-[var(--paper)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
          <span className="mx-auto block h-1 w-10 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              {stageLabel}
            </span>
          </div>
          <h1 className="mt-3 text-[2rem] font-extrabold leading-[0.98] tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed text-[var(--muted-strong)]">
            {description}
          </p>
          <div className="customer-auth-content mt-6">{children}</div>
        </div>
      </section>
    </main>
  );
}

/** Ends the session server-side, then leaves.
 *
 * Takes no role: the cookie identifies the session, and the API ends whichever
 * one the caller holds. The old sessionStorage flag was per role, which is
 * why it used to need one. */
export async function signOut() {
  try {
    await logout();
  } catch {
    // The cookie may already be gone or the API unreachable. Either way the
    // user asked to leave, so leaving is the only correct outcome.
  }
  // What this person left in the browser goes with them: the name typed at
  // sign-up and the member QR images the wallet keeps for offline use. A
  // shared phone is the ordinary case. The counter's held sales are not
  // touched - those belong to the shop, not to whoever signed out.
  try {
    window.sessionStorage.clear();
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("kyp-qr-")) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage the browser refuses has nothing in it to clear.
  }
  window.location.replace("/login?loggedOut=1");
}

/**
 * Admits a visitor the API recognises, and nobody else.
 *
 * It asks `GET /auth/session` rather than reading a flag: the session is an
 * httpOnly cookie, so the only party that can say whether it is valid is the
 * one that issued it. Fails closed on anything unexpected.
 */
export function SessionGate({
  role,
  children,
}: {
  role: DemoAuthRole;
  children: ReactNode;
}) {
  // Through the query cache rather than a bare fetch: the answer is the same
  // row every child reads through `useSession()`, so who is signed in - and
  // which platform role they hold - is known on their first render, and
  // nothing below asks the API for a view it is not allowed.
  const { data: session, error, refetch, isFetching } = useSession();
  // A platform user on live support access is the one visitor the business
  // workspace admits under another kind: the API named the grant, and it is
  // what every call inside will be checked against.
  const onSupport =
    role === "business" && session?.kind === "admin" && !!session.support;
  // Signed in to several workspaces and none chosen yet: every business call
  // would answer "No workspace selected", so the picker comes first.
  const choosing = role === "business" && session?.kind === "business" && session.needsWorkspace;
  const ready =
    !!session && !session.mfaPending && !choosing && (session.kind === role || onSupport);
  // Only the API saying "not signed in" is a reason to go to sign-in. A till
  // or a wallet with no signal used to be bounced to /login - which, offline,
  // is a form that cannot send a code, or a service-worker reload loop.
  const signedOut = error instanceof ApiError && (error.status === 401 || error.status === 403);
  const unreachable = !!error && !signedOut;

  useEffect(() => {
    if (signedOut) {
      window.location.replace("/login");
      return;
    }
    if (unreachable) return;
    if (choosing) {
      window.location.replace("/workspaces");
      return;
    }
    if (!session || ready) return;
    // A customer holding a session must not land in the merchant workspace,
    // even though the API would refuse every call anyway.
    window.location.replace(session.mfaPending ? "/verify" : "/login");
  }, [session, signedOut, unreachable, choosing, ready]);

  if (unreachable) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5">
        <div className="w-full max-w-sm text-center" role="alert">
          <p className="text-lg font-extrabold">Can&apos;t reach KYP right now.</p>
          <p className="mt-2 text-sm text-[var(--muted-strong)]">
            Check the connection, then try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-6 min-h-11 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] disabled:opacity-60"
          >
            {isFetching ? "Trying…" : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5">
        <div className="w-full max-w-sm" aria-label="Checking your session">
          <div className="h-3 w-24 rounded-full bg-[var(--line-strong)] motion-safe:animate-pulse" />
          <div className="mt-5 h-10 w-3/4 rounded-2xl bg-[var(--line)] motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-full rounded-full bg-[var(--line)] motion-safe:animate-pulse" />
          <div className="mt-10 h-48 rounded-2xl bg-[var(--surface-2)] motion-safe:animate-pulse" />
        </div>
      </main>
    );
  }

  return children;
}

function AuthShell({
  role,
  mode,
  title,
  description,
  children,
  sentTo,
}: {
  role: DemoAuthRole;
  mode: DemoAuthMode;
  title: string;
  description: string;
  children: ReactNode;
  sentTo?: string | null;
}) {
  const config = roleConfig[role];

  if (role === "customer") {
    return (
      <CustomerAuthShell mode={mode} title={title} description={description} sentTo={sentTo}>
        {children}
      </CustomerAuthShell>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] lg:grid lg:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)]">
      <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-[var(--ink)] p-8 text-[var(--paper)] lg:flex lg:flex-col xl:p-12">
        <div className="absolute -right-20 -top-20 size-64 rounded-full border-[52px] border-[var(--accent)] opacity-90" />
        <div className="relative">
          <BrandMark inverse label={config.label} />
        </div>
        <div className="relative my-auto max-w-md py-16">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]">
            Signing in
          </p>
          <h2 className="mt-5 text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] xl:text-5xl">
            Every role enters through a clear, trusted door.
          </h2>
          <div className="mt-10 divide-y divide-white/12 border-y border-white/12">
            {config.steps.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[88px_1fr] gap-4 py-4">
                <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/55">
                  {label}
                </span>
                <span className="text-sm font-bold text-white/85">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-start gap-3 border-t border-white/12 pt-5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p className="max-w-[42ch] text-xs leading-relaxed text-white/62">
            Sent over an encrypted connection and checked against your account.
            Your password is never stored in a form the platform can read.
          </p>
        </div>
      </aside>

      <section className="relative flex min-h-[100dvh] items-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="mb-10 lg:hidden">
            <BrandMark label={config.label} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--accent-strong)]">
              {config.eyebrow}
            </span>
          </div>
          <h1 className="mt-5 max-w-[13ch] text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            {description}
          </p>
          <div className="mt-9">{children}</div>
        </div>
      </section>
    </main>
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]; // fmt: skip

/** Days that exist in a given month, ignoring leap years. */
function daysIn(month: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

/**
 * Birthday as two selects: day and month, no year.
 *
 * No year on purpose. A birthday treat needs to know when to fire, not how
 * old anybody is, and an age is the kind of thing that is worth stealing and
 * can never be un-leaked. The API stores the same two numbers.
 *
 * Selects rather than a date input, because `type="date"` cannot express a
 * date without a year - it would force a year to be picked, stored, and then
 * thrown away. The day list narrows to the chosen month so 31 February is
 * never on offer, and a day already picked that the new month does not have
 * is cleared rather than left sitting there invalid.
 */
function BirthdayField({
  day,
  month,
  onDayChange,
  onMonthChange,
}: {
  day: string;
  month: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}) {
  const selectClass =
    "min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none transition focus:border-[var(--accent-strong)]";
  const limit = month ? daysIn(Number(month)) : 31;
  return (
    <fieldset className="grid gap-2">
      {/* A legend is laid out by the browser outside the fieldset's own box,
          so the grid `gap-2` never applied between it and the selects and
          this label sat flush against them while every sibling field had
          8px. The margin restores the spacing the grid could not give it. */}
      <legend className="mb-2 text-xs font-extrabold text-[var(--ink)]">
        Birthday, optional
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <select
          aria-label="Birthday month"
          value={month}
          className={selectClass}
          onChange={(event) => {
            const next = event.target.value;
            onMonthChange(next);
            // 31 January, then switching to February, would otherwise leave a
            // day the API refuses - and the error would arrive on submit,
            // pointing at a field the person had stopped looking at.
            if (next && Number(day) > daysIn(Number(next))) onDayChange("");
          }}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Birthday day"
          value={day}
          className={selectClass}
          onChange={(event) => onDayChange(event.target.value)}
        >
          <option value="">Day</option>
          {Array.from({ length: limit }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] font-semibold leading-relaxed text-[var(--muted-strong)]">
        Shops you join can send you something on your birthday. We ask for the
        day and month only - never the year - and you can add or change it
        later.
      </p>
    </fieldset>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-xs font-extrabold text-[var(--ink)]">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
      />
    </label>
  );
}

/**
 * A Philippine mobile number, with the country code already on the form.
 *
 * `+63` is printed into the field rather than typed: every customer of this
 * product is in the Philippines, so asking each of them to type the same
 * three characters - and to guess whether it wants `+63`, `0` or neither -
 * is work the form can do once. Ten digits go in, grouped as they are read
 * aloud, and E.164 comes back out, which is the only spelling the API should
 * ever be handed.
 *
 * Paste still works in every spelling: `normalizeMobile` takes `0917…`,
 * `+63 917…` or `639…` down to the same ten digits.
 */
function MobileField({
  label,
  value,
  onChange,
  autoComplete = "tel",
}: {
  label: string;
  /** E.164, or "" while the number is incomplete. */
  value: string;
  onChange: (e164: string) => void;
  autoComplete?: string;
}) {
  const national = normalizeMobile(value);
  return (
    <label className="grid gap-2 text-xs font-extrabold text-[var(--ink)]">
      {label}
      <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 transition focus-within:border-[var(--accent-strong)]">
        <span aria-hidden="true" className="text-sm font-bold text-[var(--muted-strong)]">
          +63
        </span>
        <span className="h-5 w-px bg-[var(--line-strong)]" aria-hidden="true" />
        <input
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          // The grouped form is what is shown; the digits are what is kept.
          value={displayMobile(national)}
          placeholder="917 555 0182"
          aria-describedby="mobile-hint"
          onChange={(event) => {
            const digits = normalizeMobile(event.target.value);
            // E.164 once it is a whole number, "" until then, so a caller
            // never sends the API half a number.
            onChange(toE164(digits) || digits);
          }}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[var(--muted)]"
        />
      </span>
      {/* Not shown: the printed +63 and the grouped placeholder already say
          it, and paste takes 0917, +63 917 and 639 alike, so the rule was
          instruction nobody needed to follow. Kept for a screen reader, which
          gets neither of those - the +63 is decorative and a placeholder is
          not a description. `sr-only` is out of flow, so the label's grid gap
          does not leave a hole where this used to be. */}
      <span id="mobile-hint" className="sr-only">
        Ten digits, starting with 9.
      </span>
    </label>
  );
}

function PrimaryButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] transition hover:bg-[var(--ink-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children} <ArrowRight size={16} />
    </button>
  );
}

export function DemoAuthFlow({
  role,
  mode,
  token = "",
}: {
  role: DemoAuthRole;
  mode: DemoAuthMode;
  /**
   * From the route's own searchParams, not `window`.
   *
   * Reading the query string during render makes the server and the client
   * disagree - the server has no window and renders an empty token - and
   * React throws out the whole tree over it.
   */
  token?: string;
}) {
  const config = roleConfig[role];
  // Blank, with the sample as a placeholder.
  //
  // This arrived as a real value, so the mobile field of a brand new wallet
  // came pre-filled with +63 917 555 0182 - somebody else's number. Anyone who
  // did not notice sent their one-time code to a stranger, paid for the SMS,
  // and waited on a verify screen for a code that could never arrive.
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [inviteFailure, setInviteFailure] = useState("");
  const inviteError =
    inviteFailure ||
    (mode === "invite" && !token
      ? "This link is missing its token. Ask for the invitation again."
      : "");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  // Every flow that asks for a name is somebody typing their own.
  const [name, setName] = useState("");
  // Blank, not seeded with the demo account.
  //
  // These are sign-up fields. Prefilling the customer email with an address
  // that already has a wallet made every real registration collide on the
  // unique index and answer 409, and the same state doubles as the mobile
  // field on business sign-up, so it put an email address in a phone box.
  // The one prefill worth keeping is the login identifier, which roleConfig
  // still supplies.
  const [email, setEmail] = useState("");
  // Unticked. A box that arrives already ticked records an agreement nobody
  // made: the account gets a terms_accepted_at and a terms_version proving
  // consent that was never given, which is worse evidence than none.
  const [accepted, setAccepted] = useState(false);
  // Day and month, held as the strings the two selects produce. Empty means
  // "not given", which is a valid answer: the field is optional and a wallet
  // works without it.
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [channel, setChannel] = useState<"mobile" | "email">("mobile");
  const [workspace, setWorkspace] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // The invite is read once, before anything is offered: the screen has
  // nothing honest to show until it knows which workspace this token is for.
  useEffect(() => {
    if (mode !== "invite" || !token) return;
    let live = true;
    getInvite(token)
      .then((found) => live && setInvite(found))
      .catch((failure) =>
        live &&
        setInviteFailure(
          failure instanceof ApiError ? failure.message : "That invitation could not be read.",
        ),
      );
    return () => {
      live = false;
    };
  }, [mode, token]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("loggedOut") === "1") {
      const noticeTimer = window.setTimeout(
        () => setNotice("You are signed out."),
        0,
      );
      return () => window.clearTimeout(noticeTimer);
    }
  }, []);

  useEffect(() => {
    if (mode !== "workspaces") return;
    let cancelled = false;
    getWorkspaces()
      .then((rows) => {
        if (cancelled) return;
        setWorkspaces(rows);
        // Preselect when there is only one: nobody should have to choose
        // between one thing.
        if (rows.length === 1) setWorkspace(rows[0].merchantId);
      })
      .catch(() => {
        if (!cancelled) setNotice("Could not load your workspaces.");
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (role !== "customer") return;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    return () => window.cancelAnimationFrame(frame);
  }, [mode, role]);

  // Where the code actually went. Read through useSyncExternalStore rather
  // than an effect, because session storage does not exist while this renders
  // on the server and that hook is built for exactly this: a client-only
  // source with a server snapshot. Empty means the page was opened cold and
  // there is nothing to verify against - the screen says so up front rather
  // than waiting for six digits to be typed first.
  const sentTo = useSyncExternalStore(subscribeToOtpIdentifier, readOtpIdentifier, noOtpIdentifierOnServer);
  const pendingShop = useSyncExternalStore(subscribeToPendingShop, readPendingShop, noPendingShopOnServer);

  /**
   * Whoever is already signed in on this device, if anyone.
   *
   * These screens never asked. Pressing Back after signing up landed on
   * /create-account, which cheerfully offered to set up a second wallet for
   * somebody who had just finished making their first - and filling it in
   * really did start another registration. Not a redirect, because signing in
   * as a different account is a legitimate thing to want; the screen just
   * stops pretending nobody is here.
   */
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  useEffect(() => {
    // Sign-up only. Asking on /login too meant a 401 by design on the most
    // visited page in the product, for no benefit: somebody opening sign-in
    // while signed in is ordinary, while landing on sign-*up* after pressing
    // Back is the case that offered a second wallet to somebody who had just
    // made their first.
    if (mode !== "create") return;
    let live = true;
    getSession()
      .then((session) => {
        if (live && session.kind === role) setSignedInAs(session.name || "your account");
      })
      .catch(() => {
        // Not signed in is the ordinary answer here, and it arrives as a 401.
      });
    return () => {
      live = false;
    };
  }, [mode, role]);

  function go(path: string) {
    window.location.assign(path);
  }

  function completeSession(path = "/") {
    window.location.replace(path);
  }

  /**
   * The API decides where the user lands.
   *
   * `mfaRequired` and `needsWorkspace` come back from the sign-in itself, so
   * this never has to guess - and a customer, who has no password, takes the
   * code route instead.
   */
  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setNotice(`Enter your ${config.identifierLabel.toLowerCase()}.`);
      return;
    }
    if (role !== "customer" && !password) {
      setNotice("Enter your password.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      if (role === "customer") {
        // Deliberately unconditional: the API answers the same whether or not
        // the identifier is known, so this cannot be used to discover who has
        // a wallet.
        await requestOtp(identifier.trim());
        window.sessionStorage.setItem(OTP_IDENTIFIER_KEY, identifier.trim());
        go("/verify");
        return;
      }

      const result = await login(identifier.trim(), password);
      if (result.mfaRequired) {
        go("/verify");
      } else if (result.needsWorkspace) {
        go("/workspaces");
      } else {
        completeSession("/");
      }
    } catch (failure) {
      setNotice(failure instanceof ApiError ? failure.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  /** The six-digit step: an authenticator for an admin, an SMS or email code
   *  for a customer. */
  async function submitVerify(event: FormEvent<HTMLFormElement>, destination: string) {
    event.preventDefault();
    if (code.length !== 6) {
      setNotice("Enter all six digits.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      if (role === "customer") {
        // Nothing to verify against if the page was opened cold: the number
        // lives in session storage, not the URL, so a reload in a fresh
        // context loses it. This used to fall back to the demo identifier,
        // which verified somebody into a stranger's wallet; then it fell back
        // to an empty string, which asked the API to validate "" and showed
        // the customer the raw "identifier: String should have at least 3
        // characters". Neither is an answer a person can act on.
        const sentTo = window.sessionStorage.getItem(OTP_IDENTIFIER_KEY) ?? "";
        if (!sentTo) {
          setNotice("Start again from the sign-in screen so we can send you a fresh code.");
          setBusy(false);
          return;
        }
        await verifyOtp(sentTo, code);
      } else {
        await verifyMfa(code);
      }
      completeSession(destination);
    } catch (failure) {
      setNotice(failure instanceof ApiError ? failure.message : "That code is not correct.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "login") {
    return (
      <AuthShell role={role} mode="login" title={config.signInTitle} description={config.signInDescription}>
        {notice && (
          <p aria-live="polite" className="mb-5 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-xs font-bold text-[var(--muted-strong)]">
            {notice}
          </p>
        )}
        {role === "customer" && (
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
            {(["mobile", "email"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={channel === item}
                onClick={() => {
                  setChannel(item);
                  setIdentifier("");
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-extrabold capitalize transition ${channel === item ? "bg-[var(--ink)] text-[var(--paper)] shadow-sm" : "text-[var(--muted-strong)]"}`}
              >
                {item === "mobile" ? <Smartphone size={14} /> : <Mail size={14} />}
                {item}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submitLogin} className="space-y-5" noValidate>
          {role === "customer" && channel === "mobile" ? (
            <MobileField label="Mobile number" value={identifier} onChange={setIdentifier} />
          ) : (
            <Field
              label={role === "customer" ? "Email address" : config.identifierLabel}
              type={role === "customer" ? "email" : config.identifierType}
              value={identifier}
              onChange={setIdentifier}
              // The hint follows the toggle. A customer who switched to email
              // was still shown a mobile number as the example.
              placeholder={
                role === "customer" ? "jacqueline.daniel@example.com" : config.identifier
              }
              autoComplete={role === "customer" ? "email" : "email"}
            />
          )}
          {role !== "customer" && (
            <label className="grid gap-2 text-xs font-extrabold text-[var(--ink)]">
              Password
              <span className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="min-h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 pr-12 text-sm font-semibold outline-none transition focus:border-[var(--accent-strong)]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-1 grid w-11 place-items-center text-[var(--muted-strong)]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}
          {/* "Remember this browser" / "Trust this device" was a checkbox that
              set a value nothing sent: the login body is only the email and
              the password, and how long a session lasts is policy - 30 days
              for a wallet, 12 hours for staff. Making it real is a security
              decision about shared till tablets, not a wording fix, so the
              control is gone rather than lying. Noted in BACKLOG.md. */}
          <div className="flex items-center justify-end gap-4 text-xs">
            {role !== "customer" && (
              <a href="/forgot-password" className="font-extrabold text-[var(--accent-strong)] hover:underline">
                Forgot password?
              </a>
            )}
          </div>
          <PrimaryButton>
            {role === "customer" ? (channel === "mobile" ? "Text me a code" : "Email me a code") : "Continue securely"}
          </PrimaryButton>
        </form>

        {role === "customer" && (
          <p className="mt-6 text-center text-xs text-[var(--muted-strong)]">
            New to KYP?{" "}
            <a href="/create-account" className="font-extrabold text-[var(--accent-strong)] hover:underline">
              Create your wallet
            </a>
          </p>
        )}
        {/* No self-registration for shops. A workspace exists because an
            application was approved, so the only honest link here is to the
            application - offering "create a business account" invited people
            past the queue that decides who gets one. */}
        {role === "business" && (
          <p className="mt-6 text-center text-xs leading-relaxed text-[var(--muted-strong)]">
            New shop?{" "}
            <a
              href={`${marketingSiteUrl}/partners`}
              className="font-extrabold text-[var(--accent-strong)] hover:underline"
            >
              Apply to join
            </a>
            . We set up your workspace once the application is approved, and email you the
            way in.
          </p>
        )}
      </AuthShell>
    );
  }

  if (mode === "forgot") {
    return (
      <AuthShell role={role} mode="forgot" title="Reset your access." description="Enter the work email attached to your account.">
        {sent ? (
          <div aria-live="polite" className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(15_118_85/10%)] text-[var(--success)]"><Mail size={20} /></span>
            <h2 className="mt-6 text-xl font-extrabold">Recovery instructions prepared.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
              If <strong>{identifier}</strong> has an account, a reset link is on
              its way. The answer is the same either way, so this page cannot be
              used to find out which addresses are registered.
            </p>
            <a href="/login" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]">Return to sign in <ArrowRight size={15} /></a>
          </div>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!identifier.trim()) { setNotice("Enter your work email."); return; }
              setBusy(true);
              try {
                await requestPasswordReset(identifier.trim());
              } catch {
                // Deliberately swallowed. Telling the caller this failed would
                // distinguish a known address from an unknown one, which is
                // exactly what the endpoint refuses to do.
              }
              setSent(true);
              setBusy(false);
            }}
            className="space-y-5"
          >
            <Field label="Work email" type="email" value={identifier} onChange={setIdentifier} autoComplete="email" />
            {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
            <PrimaryButton disabled={busy}>
              {busy ? "Sending\u2026" : "Send reset link"}
            </PrimaryButton>
            <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)] hover:text-[var(--ink)]"><ArrowLeft size={14} /> Back to sign in</a>
          </form>
        )}
      </AuthShell>
    );
  }

  if (mode === "reset") {
    return (
      <AuthShell
        role={role}
        mode="reset"
        title="Choose a new password."
        description="The link you followed is good for one hour and one use."
      >
        {sent ? (
          <div aria-live="polite" className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(15_118_85/10%)] text-[var(--success)]"><ShieldCheck size={20} /></span>
            <h2 className="mt-6 text-xl font-extrabold">Password changed.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
              Every other session for this account was signed out, so anyone
              else who was in it is now out.
            </p>
            <a href="/login" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]">Sign in <ArrowRight size={15} /></a>
          </div>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!token) { setNotice("That link is missing its token. Request a new one."); return; }
              // The API enforces both of these too. Checking here saves a
              // round trip and puts the message beside the field that caused it.
              if (password.length < 10) { setNotice("Use at least 10 characters."); return; }
              if (password !== confirmation) { setNotice("Those two do not match."); return; }
              setNotice("");
              setBusy(true);
              try {
                await resetPassword(token, password);
                setSent(true);
              } catch (failure) {
                setNotice(failure instanceof ApiError ? failure.message : "That did not work. Request a new link.");
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-5"
          >
            <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
            <Field label="Type it again" type="password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
            {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
            <PrimaryButton disabled={busy}>{busy ? "Saving…" : "Set new password"}</PrimaryButton>
            <a href="/forgot-password" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)] hover:text-[var(--ink)]"><ArrowLeft size={14} /> Request a new link</a>
          </form>
        )}
      </AuthShell>
    );
  }
  if (mode === "verify") {
    function verifyDestination() {
      if (role === "customer") return "/#home";
      if (role === "admin") return "/#overview";
      return "/workspaces";
    }
    // A cold open contradicted itself: "Enter the six-digit code we just sent
    // you" over "We have lost track of where that code was sent." Nothing was
    // just sent - this tab has never asked for one.
    return (
      <AuthShell
        role={role}
        mode="verify"
        title={
          role === "customer" && sentTo === ""
            ? "Ask for a fresh code."
            : role === "customer"
              ? "Enter your code."
              : "Confirm it is you."
        }
        description={
          role === "admin"
            ? "Enter the six-digit code from your administrator authenticator."
            : sentTo === ""
              ? "This page was opened without a code being sent. Start again from sign-in and we will text you one."
              : "Enter the six-digit code we just sent you."
        }
        sentTo={sentTo}
      >
        <form onSubmit={(event) => submitVerify(event, verifyDestination())} className="space-y-5">
          <label className="grid gap-2 text-xs font-extrabold">
            Six-digit verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-describedby="code-help"
              className="min-h-16 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-center font-mono text-2xl font-extrabold tracking-[0.42em] outline-none focus:border-[var(--accent-strong)]"
            />
            <span id="code-help" className="text-[10px] font-semibold text-[var(--muted)]">
              {role === "admin"
                ? "From your authenticator app"
                : sentTo === null
                  ? "Sent a moment ago"
                  : sentTo
                    // Naming it. "The address you signed in with" was wrong
                    // half the time - a customer who used the mobile tab
                    // signed in with a number - and told somebody who had
                    // lost track of which of their two numbers they used
                    // exactly nothing.
                    ? `Sent to ${sentTo}`
                    : "We have lost track of where that code was sent."}
            </span>
          </label>
          {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--muted-strong)]">{notice}</p>}
          <PrimaryButton disabled={code.length !== 6}>Verify and continue</PrimaryButton>
          {role === "customer" && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const sentTo = window.sessionStorage.getItem(OTP_IDENTIFIER_KEY) ?? "";
                if (!sentTo) {
                  setNotice("Start again from the sign-in screen so we can send you a fresh code.");
                  return;
                }
                try {
                  await requestOtp(sentTo);
                  setNotice("A new code is on its way.");
                } catch (failure) {
                  setNotice(failure instanceof ApiError ? failure.message : "Could not resend.");
                }
              }}
              className="min-h-11 w-full text-xs font-extrabold text-[var(--accent-strong)] hover:underline"
            >
              Resend code
            </button>
          )}
          {/* A number with no wallet still gets "Sent to +63...", because the
              request deliberately does not reveal whether an account exists -
              but then every code is refused and there was nowhere to go. The
              sign-up link is the missing half of that: it costs an enumerator
              nothing and it is exactly what somebody who mistyped a digit, or
              who never had a wallet, actually needs. */}
          {role === "customer" && (
            <a
              href="/create-account"
              className="flex min-h-11 items-center justify-center text-xs font-extrabold text-[var(--accent-strong)] hover:underline"
            >
              No code arriving? Create a wallet
            </a>
          )}
          {/* The way out. When the code cannot be checked at all this is the
              only thing on the screen that does anything, so it says what it
              is for instead of offering a choice of account nobody is making. */}
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> {role === "customer" && sentTo === "" ? "Back to sign-in for a fresh code" : "Use another account"}</a>
        </form>
      </AuthShell>
    );
  }

  if (mode === "create") {
    return (
      <AuthShell
        role="customer"
        mode="create"
        title={pendingShop ? "Save your stamp." : "Set up your wallet."}
        description={
          pendingShop
            ? `Your first stamp at ${pendingShop} is waiting. Give us a number and it goes on your card.`
            : "Keep rewards from nearby businesses together, with permissions you can change anytime."
        }
      >
        {/* Pressing Back after signing up landed here, offering a second
            wallet to somebody who had just made their first. */}
        {signedInAs && (
          <div className="mb-5 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-xs font-bold text-[var(--muted-strong)]">
            You are already signed in as {signedInAs}.{" "}
            <Link href="/#home" className="text-[var(--accent-strong)] underline underline-offset-2">
              Open your wallet
            </Link>
            , or fill this in to set up a different one.
          </div>
        )}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) { setNotice("Enter your name."); return; }
            if (!identifier.trim()) { setNotice("Enter your mobile number."); return; }
            if (!accepted) { setNotice("Accept the terms to continue."); return; }

            setBusy(true);
            setNotice("");
            try {
              // Answers the same whether or not the number is already
              // registered, so this cannot be used to discover who has a
              // wallet. Either way a code is on its way.
              await registerCustomer({
                name: name.trim(),
                mobile: identifier.trim(),
                email: email.trim() || undefined,
                // Both or neither: the API refuses a half-filled birthday,
                // and the form treats a partly answered optional question as
                // not answered rather than blocking the sign-up over it.
                ...(birthdayDay && birthdayMonth
                  ? {
                      birthdayDay: Number(birthdayDay),
                      birthdayMonth: Number(birthdayMonth),
                    }
                  : {}),
                acceptedTerms: accepted,
              });
              window.sessionStorage.setItem("kypstamping-customer-signup-name", name);
              window.sessionStorage.setItem(OTP_IDENTIFIER_KEY, identifier.trim());
              go("/verify");
            } catch (failure) {
              setNotice(
                failure instanceof ApiError ? failure.message : "Could not set that up.",
              );
              setBusy(false);
            }
          }}
          className="space-y-5"
        >
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
          <MobileField label="Mobile number" value={identifier} onChange={setIdentifier} />
          <Field label="Email, optional" type="email" value={email} onChange={setEmail} autoComplete="email" required={false} />
          <BirthdayField
            day={birthdayDay}
            month={birthdayMonth}
            onDayChange={setBirthdayDay}
            onMonthChange={setBirthdayMonth}
          />
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
            <span>
              I agree to the{" "}
              <a
                href={`${shopperSiteUrl}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                terms
              </a>{" "}
              and the{" "}
              <a
                href={`${shopperSiteUrl}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                privacy notice
              </a>
              .
            </span>
          </label>
          {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
          <PrimaryButton disabled={busy}>
            {busy ? "Setting up\u2026" : "Create wallet"}
          </PrimaryButton>
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> I already have a wallet</a>
        </form>
      </AuthShell>
    );
  }

  if (mode === "workspaces") {
    /*
     * The two options here were hardcoded - "Sweet Crumbs Bakery" and
     * "Sage & Steam" - so a user saw a workspace they had no access to and
     * missed any they did. They come from GET /auth/workspaces, which returns
     * the merchants this session may actually enter, with the role it holds
     * in each.
     */
    return (
      <AuthShell
        role="business"
        mode="workspaces"
        title="Choose your workspace."
        description="Your role and location access change with the workspace you enter."
      >
        {notice && (
          <p aria-live="polite" className="mb-5 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-xs font-bold text-[var(--muted-strong)]">
            {notice}
          </p>
        )}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!workspace) {
              setNotice("Pick a workspace to continue.");
              return;
            }
            setBusy(true);
            try {
              await selectWorkspace(workspace);
              completeSession("/#dashboard");
            } catch (failure) {
              setNotice(
                failure instanceof ApiError ? failure.message : "Could not open that workspace.",
              );
              setBusy(false);
            }
          }}
          className="space-y-3"
        >
          {workspaces.length === 0 && (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted-strong)]">
              No workspace is linked to this account yet.
            </p>
          )}
          {workspaces.map((option) => {
            const selected = workspace === option.merchantId;
            return (
              <label
                key={option.merchantId}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${selected ? "border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"}`}
              >
                <input
                  type="radio"
                  name="workspace"
                  value={option.merchantId}
                  checked={selected}
                  onChange={() => setWorkspace(option.merchantId)}
                  className="sr-only"
                />
                <span className={`grid size-11 place-items-center rounded-2xl ${selected ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}>
                  <Store size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">{option.name}</span>
                  <span className="mt-1 block text-xs text-[var(--muted-strong)]">
                    {/* The city first: two workspaces can share a name, and
                        "Owner · All locations" twice told the tester nothing. */}
                    {[option.city, option.role, option.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {selected && <Check size={17} className="text-[var(--success)]" />}
              </label>
            );
          })}
          <div className="pt-3">
            <PrimaryButton disabled={busy}>
              {busy ? "Opening\u2026" : "Open selected workspace"}
            </PrimaryButton>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-11 w-full text-xs font-extrabold text-[var(--muted-strong)] hover:text-[var(--ink)]"
          >
            Sign in with another account
          </button>
        </form>
      </AuthShell>
    );
  }

  if (inviteError) {
    return (
      <AuthShell role="business" mode="invite" title="That invitation has expired." description="Invitations are good for seven days and one use.">
        <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
          {inviteError}
        </p>
        <a href="/login" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]">Go to sign in <ArrowRight size={15} /></a>
      </AuthShell>
    );
  }

  if (!invite) {
    return (
      <AuthShell role="business" mode="invite" title="You have been invited." description="Reading your invitation…">
        <div className="h-52 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" />
      </AuthShell>
    );
  }

  return (
    <AuthShell role="business" mode="invite" title="You have been invited." description={`Review the role before joining ${invite.businessName}.`}>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="bg-[var(--ink)] p-6 text-[var(--paper)]">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)]"><UserRoundPlus size={20} /></span>
          <h2 className="mt-6 text-xl font-extrabold">{invite.businessName}</h2>
          <p className="mt-1 text-xs text-white/65">Sent to {invite.email}</p>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {[["Role", invite.role], ["Locations", invite.location]].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[86px_1fr] gap-3 px-6 py-4"><span className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]">{label}</span><span className="text-xs font-bold">{value}</span></div>
          ))}
        </div>
      </div>
      <form
        className="mt-5 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (password.length < 10) { setNotice("Use at least 10 characters."); return; }
          setNotice("");
          setBusy(true);
          try {
            // Accepting signs you in, so there is nowhere to send you but in.
            await acceptInvite(
              token,
              { name: name.trim(), password },
            );
            go("/workspaces");
          } catch (failure) {
            setNotice(failure instanceof ApiError ? failure.message : "That did not work. Ask for a new invitation.");
            setBusy(false);
          }
        }}
      >
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" />
        <Field label="Choose a password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
        <PrimaryButton disabled={busy}>{busy ? "Joining…" : `Join ${invite.businessName}`}</PrimaryButton>
      </form>
      <a href="/login" className="mt-3 flex min-h-11 items-center justify-center text-xs font-extrabold text-[var(--muted-strong)]">Decline and return to sign in</a>
    </AuthShell>
  );
}
