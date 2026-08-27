"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  CreditCard,
  Gift,
  MapPin,
  Printer,
  ScanLine,
  Stamp,
  Store,
  Webhook,
} from "lucide-react";
import { BrandMark, DemoBadge, Eyebrow } from "@stampr/ui";
import { startDemoSession } from "@stampr/ui/auth";

// ponytail: city-level only. Exact coordinates are deliberately not collected —
// discovery matches on city and area, which keeps this out of sensitive-location territory.
const CITIES = [
  "Makati",
  "Taguig",
  "Pasig",
  "Quezon City",
  "Manila",
  "Mandaluyong",
  "Cebu City",
  "Davao City",
];

const CATEGORIES = [
  "Cafe or bakery",
  "Restaurant",
  "Salon or spa",
  "Retail shop",
  "Fitness or studio",
  "Services",
];

const PROGRAMS = [
  {
    id: "stamps",
    name: "Stamp card",
    icon: Stamp,
    detail: "Eight visits, then a reward on the house. The simplest place to start.",
    popular: true,
  },
  {
    id: "points",
    name: "Points",
    icon: Coins,
    detail: "Earn points per peso spent, then redeem against a reward menu.",
    popular: false,
  },
  {
    id: "membership",
    name: "Membership",
    icon: CreditCard,
    detail: "Recurring perks for regulars, tracked by visits or a paid tier.",
    popular: false,
  },
  {
    id: "coupon",
    name: "Coupon drop",
    icon: Gift,
    detail: "One-off offers with an expiry, useful for winning lapsed customers back.",
    popular: false,
  },
];

const COUNTER_METHODS = [
  {
    id: "terminal",
    name: "KYPStamping terminal",
    icon: ScanLine,
    detail: "Scan customer codes from any phone or tablet beside your register. No POS change.",
    availability: "Ready now",
  },
  {
    id: "print",
    name: "Printed join code",
    icon: Printer,
    detail: "Put a poster on the counter. Customers scan it to join, then show their own code back.",
    availability: "Ready now",
  },
  {
    id: "api",
    name: "Connect my POS",
    icon: Webhook,
    detail: "Send sales through the shared event contract so stamps happen automatically.",
    availability: "Needs a developer",
  },
];

const STEPS = ["Business", "Program", "Counter"] as const;

export function BusinessOnboarding() {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("Sweet Crumbs Bakery");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [city, setCity] = useState("Pasig");
  const [locations, setLocations] = useState(1);
  const [program, setProgram] = useState("stamps");
  const [method, setMethod] = useState("terminal");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("stampr-business-signup");
    if (!saved) return;
    const timer = window.setTimeout(() => setBusinessName(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function next() {
    if (step === 0 && !businessName.trim()) {
      setNotice("Enter your business name to continue.");
      return;
    }
    setNotice("");
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function finish() {
    // Carry the answers forward instead of discarding them, so the workspace
    // the merchant lands in reflects what they just configured.
    window.sessionStorage.setItem(
      "stampr-business-profile",
      JSON.stringify({ businessName, category, city, locations, program, method }),
    );
    window.sessionStorage.removeItem("stampr-business-signup");
    startDemoSession("business");
    window.location.replace("/#dashboard");
  }

  const selectedProgram = PROGRAMS.find((item) => item.id === program);
  const selectedMethod = COUNTER_METHODS.find((item) => item.id === method);

  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] px-5 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandMark />
          <DemoBadge />
        </header>

        <ol className="mt-9 flex items-center gap-2" aria-label="Setup progress">
          {STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                    done
                      ? "bg-[var(--success)] text-white"
                      : active
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "bg-[var(--surface-2)] text-[var(--muted-strong)]"
                  }`}
                >
                  {done ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                <span
                  className={`text-xs font-extrabold ${active ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
                >
                  {label}
                </span>
                {index < STEPS.length - 1 && <span className="h-px flex-1 bg-[var(--line)]" />}
              </li>
            );
          })}
        </ol>

        <section className="mt-7 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          {step === 0 && (
            <>
              <span className="text-[var(--accent-strong)]">
                <Eyebrow>Step one</Eyebrow>
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                Tell us about your business.
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-strong)]">
                This sets your workspace name and helps nearby customers discover you.
              </p>
              <div className="mt-7 space-y-5">
                <label className="grid gap-2 text-xs font-extrabold">
                  Business name
                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    autoComplete="organization"
                    className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--accent-strong)]"
                  />
                </label>
                <label className="grid gap-2 text-xs font-extrabold">
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--accent-strong)]"
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-extrabold">
                    City
                    <select
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--accent-strong)]"
                    >
                      {CITIES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      Discovery matches by city and area, never exact location.
                    </span>
                  </label>
                  <label className="grid gap-2 text-xs font-extrabold">
                    Locations
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={locations}
                      onChange={(event) =>
                        setLocations(Math.max(1, Math.min(99, Number(event.target.value) || 1)))
                      }
                      className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--accent-strong)]"
                    />
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      You can add branches later.
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <span className="text-[var(--accent-strong)]">
                <Eyebrow>Step two</Eyebrow>
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                Pick your first program.
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-strong)]">
                Start with one. You can run several at once once you are live.
              </p>
              <div className="mt-7 space-y-3">
                {PROGRAMS.map((item) => {
                  const Icon = item.icon;
                  const selected = program === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition focus-within:border-[var(--accent-strong)] ${
                        selected
                          ? "border-[var(--ink)] bg-[var(--surface-2)]"
                          : "border-[var(--line)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={item.id}
                        checked={selected}
                        onChange={() => setProgram(item.id)}
                        className="sr-only"
                      />
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${selected ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold">{item.name}</span>
                          {item.popular && (
                            <span className="rounded-full bg-[rgb(232_163_61/16%)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                              Most popular
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--muted-strong)]">
                          {item.detail}
                        </span>
                      </span>
                      {selected && (
                        <Check
                          size={17}
                          className="mt-1 shrink-0 text-[var(--success)]"
                          aria-hidden="true"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <span className="text-[var(--accent-strong)]">
                <Eyebrow>Step three</Eyebrow>
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                How will you stamp at the counter?
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-strong)]">
                Most businesses start with the terminal and connect a POS later.
              </p>
              <div className="mt-7 space-y-3">
                {COUNTER_METHODS.map((item) => {
                  const Icon = item.icon;
                  const selected = method === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition focus-within:border-[var(--accent-strong)] ${
                        selected
                          ? "border-[var(--ink)] bg-[var(--surface-2)]"
                          : "border-[var(--line)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={item.id}
                        checked={selected}
                        onChange={() => setMethod(item.id)}
                        className="sr-only"
                      />
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${selected ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold">{item.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--muted-strong)]">
                          {item.detail}
                        </span>
                      </span>
                      <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                        {item.availability}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-7 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Ready to open
                </p>
                <dl className="mt-3 grid gap-2 text-xs">
                  {[
                    ["Workspace", businessName],
                    ["Category", category],
                    ["Area", `${city} · ${locations} location${locations > 1 ? "s" : ""}`],
                    ["Program", selectedProgram?.name ?? ""],
                    ["Counter", selectedMethod?.name ?? ""],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[84px_1fr] gap-3">
                      <dt className="font-extrabold text-[var(--muted)]">{label}</dt>
                      <dd className="font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}

          {notice && (
            <p aria-live="polite" className="mt-5 text-xs font-bold text-[var(--danger)]">
              {notice}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--line-strong)] px-5 text-sm font-extrabold transition hover:bg-[var(--surface-2)]"
              >
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] transition active:scale-[0.99]"
              >
                Continue <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] transition active:scale-[0.99]"
              >
                <Store size={16} aria-hidden="true" /> Open my workspace
              </button>
            )}
          </div>
        </section>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[var(--muted-strong)]">
          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Nothing here is saved to a server. This demo shows the sign-up path a real
          merchant would take before the shared API is connected.
        </p>
      </div>
    </main>
  );
}
