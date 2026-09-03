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
  registerBusiness,
  registerCustomer,
  requestOtp,
  getInvite,
  requestPasswordReset,
  resetPassword,
  selectWorkspace,
  getWorkspaces,
  verifyMfa,
  verifyOtp,
  type InvitePreview,
  type Workspace,
} from "@kypstamping/api";
import { BrandMark, StampDots } from "./index";

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

/** Where the terms and privacy notice live. The four apps already agree on
 *  NEXT_PUBLIC_SITE_URL; the fallback is the production marketing site so a
 *  build without the variable still links somewhere real rather than to a
 *  relative path these apps do not serve. */
const marketingSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kypstamping.ph";

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

function CustomerAuthVisual({ mode }: { mode: DemoAuthMode }) {
  if (mode === "verify") {
    return (
      <div className="customer-auth-visual customer-auth-code-card">
        <span className="grid size-12 place-items-center rounded-xl bg-[var(--surface)] text-[var(--accent-strong)] shadow-sm">
          <Smartphone size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
            Code ready
          </p>
          {/* It said "Sent to your mobile" on the email path too, so somebody
              who signed in with an address sat waiting for an SMS. The line
              under the input names the real destination; this one no longer
              contradicts it. */}
          <p className="mt-1 text-sm font-extrabold tracking-[-0.02em]">Check your messages</p>
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
}: {
  mode: DemoAuthMode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const stageLabel = mode === "verify" ? "Verify" : mode === "create" ? "Join KYPStamping" : "Welcome back";

  return (
    <main className="customer-auth min-h-[100dvh] bg-[#d9d5ce] sm:px-5 sm:py-6">
      <section className="phone-shell relative mx-auto flex min-h-[100dvh] max-w-[460px] flex-col overflow-hidden border-x border-[rgb(24_18_12/8%)] bg-[var(--accent)] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[var(--radius-card)] sm:border sm:shadow-[0_28px_90px_rgb(24_18_12/20%)]">
        <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-[max(1.1rem,env(safe-area-inset-top))]">
          <BrandMark label="Wallet" />
        </header>

        <div className="px-5 pb-5">
          <CustomerAuthVisual mode={mode} />
        </div>

        <div className="customer-auth-sheet flex-1 rounded-t-[18px] bg-[var(--paper)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
          <span className="mx-auto block h-1 w-10 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              {stageLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--success)]">
              <span className="size-1.5 rounded-full bg-[var(--success)]" /> Private by default
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (cancelled) return;
        if (session.kind !== role) {
          // A customer holding a session must not land in the merchant
          // workspace, even though the API would refuse every call anyway.
          window.location.replace("/login");
          return;
        }
        if (session.mfaPending) {
          window.location.replace("/verify");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) window.location.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

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
}: {
  role: DemoAuthRole;
  mode: DemoAuthMode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const config = roleConfig[role];

  if (role === "customer") {
    return (
      <CustomerAuthShell mode={mode} title={title} description={description}>
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
  const [remember, setRemember] = useState(true);
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
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  // Unticked. A box that arrives already ticked records an agreement nobody
  // made: the account gets a terms_accepted_at and a terms_version proving
  // consent that was never given, which is worse evidence than none.
  const [accepted, setAccepted] = useState(false);
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
        go("/onboarding");
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
          <Field
            label={role === "customer" ? (channel === "mobile" ? "Mobile number" : "Email address") : config.identifierLabel}
            type={role === "customer" && channel === "mobile" ? "tel" : "email"}
            value={identifier}
            onChange={setIdentifier}
            // The hint follows the toggle. A customer who switched to email
            // was still shown a mobile number as the example.
            placeholder={
              role === "customer" && channel === "email"
                ? "jacqueline.daniel@example.com"
                : config.identifier
            }
            autoComplete={role === "customer" && channel === "mobile" ? "tel" : "email"}
          />
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
          <div className="flex items-center justify-between gap-4 text-xs">
            <label className="inline-flex items-center gap-2 font-bold text-[var(--muted-strong)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="size-4 accent-[var(--ink)]"
              />
              {role === "customer" ? "Trust this device" : "Remember this browser"}
            </label>
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

        {(role === "customer" || role === "business") && (
          <p className="mt-6 text-center text-xs text-[var(--muted-strong)]">
            New to KYPStamping?{" "}
            <a href="/create-account" className="font-extrabold text-[var(--accent-strong)] hover:underline">
              {role === "business" ? "Create a business account" : "Create your wallet"}
            </a>
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
      return window.sessionStorage.getItem("kypstamping-business-signup")
        ? "/onboarding"
        : "/workspaces";
    }
    return (
      <AuthShell role={role} mode="verify" title={role === "customer" ? "Enter your code." : "Confirm it is you."} description={role === "admin" ? "Enter the six-digit code from your administrator authenticator." : role === "customer" ? "Enter the six-digit code we just sent you." : "Enter the six-digit code we just sent you."}>
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
          {/* The way out. When the code cannot be checked at all this is the
              only thing on the screen that does anything, so it says what it
              is for instead of offering a choice of account nobody is making. */}
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> {role === "customer" && sentTo === "" ? "Back to sign-in for a fresh code" : "Use another account"}</a>
        </form>
      </AuthShell>
    );
  }

  if (mode === "create" && role === "business") {
    return (
      <AuthShell role="business" mode="create" title="Start your loyalty program." description="Create the workspace for your business. You can add locations, staff, and your first program right after.">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!businessName.trim()) { setNotice("Enter your business name."); return; }
            if (!name.trim()) { setNotice("Enter your full name."); return; }
            if (!identifier.trim()) { setNotice("Enter your work email."); return; }
            // Checked here so the rule is stated in the words the caption
            // uses. Left to the API, the sign-up page answered "password:
            // String should have at least 10 characters" - a Pydantic
            // validator's own sentence, shown to somebody creating their
            // first account. The reset-password screen already did this.
            if (password.length < 10) { setNotice("Use at least 10 characters."); return; }
            if (!accepted) { setNotice("Accept the terms to continue."); return; }

            setBusy(true);
            setNotice("");
            try {
              // Creates the account and signs it in. The workspace itself
              // comes next, in the wizard - which is why the API answers
              // needsWorkspace here.
              await registerBusiness({
                name: name.trim(),
                email: identifier.trim(),
                password,
                acceptedTerms: accepted,
              });
              // Carried so the wizard can open with the name already typed.
              window.sessionStorage.setItem("kypstamping-business-signup", businessName);
              go("/onboarding");
            } catch (failure) {
              setNotice(
                failure instanceof ApiError
                  ? failure.message
                  : "Could not create that account.",
              );
              setBusy(false);
            }
          }}
          className="space-y-5"
        >
          <Field label="Business name" value={businessName} onChange={setBusinessName} autoComplete="organization" />
          <Field label="Your full name" value={name} onChange={setName} autoComplete="name" />
          <Field label="Work email" type="email" value={identifier} onChange={setIdentifier} autoComplete="email" />
          <Field label="Mobile number" type="tel" value={email} onChange={setEmail} autoComplete="tel" />
          <label className="grid gap-2 text-xs font-extrabold">
            Password
            <span className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 pr-12 text-sm font-semibold outline-none focus:border-[var(--accent-strong)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 grid size-9 place-items-center rounded-lg text-[var(--muted-strong)] hover:bg-[var(--surface-2)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">
              {/* What is actually enforced. This promised twelve characters
                  with an uppercase letter and a number; the form checked ten
                  and the API checked ten, so every part of that sentence
                  except "characters" was untrue. */}
              At least 10 characters.
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
            <span>
              I agree to the{" "}
              <a
                href={`${marketingSiteUrl}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                terms
              </a>{" "}
              and the{" "}
              <a
                href={`${marketingSiteUrl}/privacy`}
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
            {busy ? "Creating\u2026" : "Create workspace"}
          </PrimaryButton>
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> I already have an account</a>
        </form>
      </AuthShell>
    );
  }

  if (mode === "create") {
    return (
      <AuthShell role="customer" mode="create" title="Set up your wallet." description="Keep rewards from nearby businesses together, with permissions you can change anytime.">
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
          <Field label="Mobile number" type="tel" value={identifier} onChange={setIdentifier} autoComplete="tel" />
          <Field label="Email, optional" type="email" value={email} onChange={setEmail} autoComplete="email" required={false} />
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
            <span>
              I agree to the{" "}
              <a
                href={`${marketingSiteUrl}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                terms
              </a>{" "}
              and the{" "}
              <a
                href={`${marketingSiteUrl}/privacy`}
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
                    {option.role} · {option.location}
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
