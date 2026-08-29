"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Croissant,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  LockKeyhole,
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
  requestOtp,
  verifyMfa,
  verifyOtp,
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

export type DemoAuthRole = "business" | "admin" | "customer";
export type DemoAuthMode =
  | "login"
  | "forgot"
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
    steps: [
      ["Workspace", "Sweet Crumbs Bakery"],
      ["Role", "Owner · all locations"],
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
      ["Member", "Jacqueline Daniel"],
      ["Wallet", "4 local businesses"],
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
          <p className="mt-1 text-sm font-extrabold tracking-[-0.02em]">Sent to your demo mobile</p>
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
            <p className="text-sm font-extrabold tracking-[-0.025em]">Sweet Crumbs</p>
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(24_18_12/12%)] bg-[rgb(255_254_251/42%)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--ink)]">
            <LockKeyhole size={11} /> Demo only
          </span>
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

/** Ends the session server-side, then leaves. */
export async function signOut(role: DemoAuthRole) {
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
        <div className="w-full max-w-sm" aria-label="Checking demo session">
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
            Demo access receipt
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
            Frontend demo only. Credentials stay in this browser session and no
            identity provider or backend receives them.
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
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted-strong)]">
              Frontend demo
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

function DemoBoundary({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--surface-2)] px-3.5 py-3">
        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
        <p className="text-[11px] leading-relaxed text-[var(--muted-strong)]">
          Demo mode: nothing is sent or saved to a server.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[rgb(15_118_85/18%)] bg-[rgb(15_118_85/7%)] p-4">
      <BadgeCheck size={17} className="mt-0.5 shrink-0 text-[var(--success)]" />
      <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
        Any correctly formatted demo input works. Nothing is sent, stored on a
        server, or used to contact a real person.
      </p>
    </div>
  );
}

export function DemoAuthFlow({ role, mode }: { role: DemoAuthRole; mode: DemoAuthMode }) {
  const config = roleConfig[role];
  const [identifier, setIdentifier] = useState<string>(config.identifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Jacqueline Daniel");
  const [businessName, setBusinessName] = useState("Sweet Crumbs Bakery");
  const [email, setEmail] = useState("jacqueline.daniel@example.com");
  const [accepted, setAccepted] = useState(true);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [channel, setChannel] = useState<"mobile" | "email">("mobile");
  const [workspace, setWorkspace] = useState("sweet-crumbs");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("loggedOut") === "1") {
      const noticeTimer = window.setTimeout(
        () => setNotice("You signed out of the demo session."),
        0,
      );
      return () => window.clearTimeout(noticeTimer);
    }
  }, []);

  useEffect(() => {
    if (role !== "customer") return;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    return () => window.cancelAnimationFrame(frame);
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
        const sentTo = window.sessionStorage.getItem(OTP_IDENTIFIER_KEY) ?? identifier.trim();
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
                  setIdentifier(item === "mobile" ? "+63 917 555 0182" : "jacqueline.daniel@example.com");
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

        <div className="my-6 flex items-center gap-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" /> {role === "customer" ? "Or" : "Or use demo identity"} <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <div className={`grid gap-2 ${role === "business" ? "sm:grid-cols-2" : ""}`}>
          {role === "business" ? (
            <>
              <button type="button" onClick={() => go("/workspaces")} className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold transition hover:bg-[var(--surface-2)] active:scale-[0.98]">
                Continue with Google
              </button>
              <button type="button" onClick={() => go("/workspaces")} className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold transition hover:bg-[var(--surface-2)] active:scale-[0.98]">
                Continue with Microsoft
              </button>
            </>
          ) : role === "admin" ? (
            <button type="button" onClick={() => go("/verify")} className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold transition hover:bg-[var(--surface-2)] active:scale-[0.98]">
              Continue with platform SSO
            </button>
          ) : (
            <button type="button" onClick={() => completeSession("/#home")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold transition hover:bg-[var(--surface-2)] active:scale-[0.98]">
              <KeyRound size={15} /> Use a passkey on this device
            </button>
          )}
        </div>
        {(role === "customer" || role === "business") && (
          <p className="mt-6 text-center text-xs text-[var(--muted-strong)]">
            New to KYPStamping?{" "}
            <a href="/create-account" className="font-extrabold text-[var(--accent-strong)] hover:underline">
              {role === "business" ? "Create a business account" : "Create your wallet"}
            </a>
          </p>
        )}
        <DemoBoundary compact={role === "customer"} />
      </AuthShell>
    );
  }

  if (mode === "forgot") {
    return (
      <AuthShell role={role} mode="forgot" title="Reset your access." description="Enter the work email attached to your demo account. The recovery state is simulated locally.">
        {sent ? (
          <div aria-live="polite" className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(15_118_85/10%)] text-[var(--success)]"><Mail size={20} /></span>
            <h2 className="mt-6 text-xl font-extrabold">Recovery instructions prepared.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">A demo recovery link for <strong>{identifier}</strong> is ready. No email was actually sent.</p>
            <a href="/login" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]">Return to sign in <ArrowRight size={15} /></a>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); setSent(true); }} className="space-y-5">
            <Field label="Work email" type="email" value={identifier} onChange={setIdentifier} autoComplete="email" />
            <PrimaryButton>Prepare recovery link</PrimaryButton>
            <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)] hover:text-[var(--ink)]"><ArrowLeft size={14} /> Back to sign in</a>
          </form>
        )}
        <DemoBoundary compact={role === "customer"} />
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
      <AuthShell role={role} mode="verify" title={role === "customer" ? "Enter your code." : "Confirm it is you."} description={role === "admin" ? "Enter the six-digit code from your administrator authenticator." : role === "customer" ? "Use the six-digit code prepared for your demo wallet." : "Enter the six-digit code prepared for your demo account."}>
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
                : "Sent to the address you signed in with"}
            </span>
          </label>
          {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--muted-strong)]">{notice}</p>}
          <PrimaryButton disabled={code.length !== 6}>Verify and continue</PrimaryButton>
          {role === "customer" && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const sentTo =
                  window.sessionStorage.getItem(OTP_IDENTIFIER_KEY) ?? identifier.trim();
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
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> Use another account</a>
        </form>
        <DemoBoundary compact={role === "customer"} />
      </AuthShell>
    );
  }

  if (mode === "create" && role === "business") {
    return (
      <AuthShell role="business" mode="create" title="Start your loyalty program." description="Create the workspace for your business. You can add locations, staff, and your first program right after.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!businessName.trim()) { setNotice("Enter your business name."); return; }
            if (!identifier.trim()) { setNotice("Enter your work email."); return; }
            if (password.length < 8) { setNotice("Use at least 8 characters for this demo password."); return; }
            if (!accepted) { setNotice("Accept the terms to continue."); return; }
            window.sessionStorage.setItem("kypstamping-business-signup", businessName);
            go("/verify");
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
            <span className="text-[10px] font-semibold text-[var(--muted)]">At least 8 characters.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
            <span>I agree to the demo terms and understand no real workspace is created.</span>
          </label>
          {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
          <PrimaryButton>Create demo workspace</PrimaryButton>
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> I already have an account</a>
        </form>
        <DemoBoundary />
      </AuthShell>
    );
  }

  if (mode === "create") {
    return (
      <AuthShell role="customer" mode="create" title="Set up your wallet." description="Keep rewards from nearby businesses together, with permissions you can change anytime.">
        <form onSubmit={(event) => { event.preventDefault(); if (!accepted) { setNotice("Accept the terms to continue."); return; } window.sessionStorage.setItem("kypstamping-customer-signup-name", name); go("/verify"); }} className="space-y-5">
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
          <Field label="Mobile number" type="tel" value={identifier} onChange={setIdentifier} autoComplete="tel" />
          <Field label="Email, optional" type="email" value={email} onChange={setEmail} autoComplete="email" required={false} />
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
            <span>I agree to the demo terms and understand no real account is created.</span>
          </label>
          {notice && <p aria-live="polite" className="text-xs font-bold text-[var(--danger)]">{notice}</p>}
          <PrimaryButton>Create demo wallet</PrimaryButton>
          <a href="/login" className="flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted-strong)]"><ArrowLeft size={14} /> I already have a wallet</a>
        </form>
      </AuthShell>
    );
  }

  if (mode === "workspaces") {
    const options = [
      { id: "sweet-crumbs", name: "Sweet Crumbs Bakery", detail: "Owner · 3 locations", badge: "Live", icon: Store },
      { id: "sage-steam", name: "Sage & Steam", detail: "Analyst · 2 locations", badge: "Training", icon: Building2 },
    ];
    return (
      <AuthShell role="business" mode="workspaces" title="Choose your workspace." description="Your demo role and location access change with the workspace you enter.">
        <form onSubmit={(event) => { event.preventDefault(); completeSession("/#dashboard"); }} className="space-y-3">
          {options.map((option) => {
            const Icon = option.icon;
            const selected = workspace === option.id;
            return (
              <label key={option.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${selected ? "border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"}`}>
                <input type="radio" name="workspace" value={option.id} checked={selected} onChange={() => setWorkspace(option.id)} className="sr-only" />
                <span className={`grid size-11 place-items-center rounded-2xl ${selected ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}><Icon size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">{option.name}</span>
                  <span className="mt-1 block text-xs text-[var(--muted-strong)]">{option.detail}</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">{option.badge}</span>
                {selected && <Check size={17} className="text-[var(--success)]" />}
              </label>
            );
          })}
          <div className="pt-3"><PrimaryButton>Open selected workspace</PrimaryButton></div>
          <button type="button" onClick={() => signOut("business")} className="min-h-11 w-full text-xs font-extrabold text-[var(--muted-strong)] hover:text-[var(--ink)]">Sign in with another account</button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell role="business" mode="invite" title="You have been invited." description="Review the role and locations before joining the Sweet Crumbs demo workspace.">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="bg-[var(--ink)] p-6 text-[var(--paper)]">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)]"><UserRoundPlus size={20} /></span>
          <h2 className="mt-6 text-xl font-extrabold">Sweet Crumbs Bakery</h2>
          <p className="mt-1 text-xs text-white/65">Invited by Mara Santos · Owner</p>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {[["Role", "Manager"], ["Locations", "Kapitolyo and BGC High Street"], ["Access", "Customers, campaigns, and reports"]].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[86px_1fr] gap-3 px-6 py-4"><span className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]">{label}</span><span className="text-xs font-bold">{value}</span></div>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => go("/workspaces")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]">Accept demo invitation <ChevronRight size={16} /></button>
      <a href="/login" className="mt-3 flex min-h-11 items-center justify-center text-xs font-extrabold text-[var(--muted-strong)]">Decline and return to sign in</a>
      <DemoBoundary />
    </AuthShell>
  );
}
