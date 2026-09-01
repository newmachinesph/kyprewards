"use client";

/**
 * What the customer actually holds, and how they use it.
 *
 * The site described the wallet in prose and never showed it - a visitor
 * deciding whether to run a loyalty program could read "one private mobile
 * wallet" and still have no idea what lands on their customer's phone.
 *
 * Both pieces here mirror the real customer app rather than illustrating an
 * idea of it: the card has the same two sides, the same brand tokens, and the
 * same copy, and the walkthrough is the journey the API actually supports -
 * including the first stamp landing before there is an account, which is the
 * part competitors make people sign up for.
 */

import { useState } from "react";
import {
  Check,
  QrCode,
  RefreshCw,
  ScanLine,
  Smartphone,
  Sparkles,
  Stamp,
} from "lucide-react";
import { BRAND_COLORS } from "@kypstamping/ui";
import { SiteEyebrow } from "./MarketingUi";

/** Ink at a strength, against whatever ground the card is on. */
const ink = (percent: number) =>
  `color-mix(in oklab, var(--card-ink) ${percent}%, transparent)`;

const STEPS = [
  {
    title: "Scan the code on the counter",
    detail:
      "A poster or a card by the till. It opens in the browser they already have - no app store, no download, nothing to install.",
    icon: ScanLine,
  },
  {
    title: "The first stamp lands right away",
    detail:
      "Before any sign-up. Most programs make somebody register to earn their first stamp, which is where most of them are abandoned. The stamp is already theirs; the account catches up later.",
    icon: Stamp,
  },
  {
    title: "The card lives in their wallet",
    detail:
      "Every shop they join keeps its own card in one place, with the shop's own colour and photo. Nothing to carry, nothing to lose, no expiry.",
    icon: Smartphone,
  },
  {
    title: "Show the code, collect the reward",
    detail:
      "Turn the card over for a scannable member code. The same code works at every business they have joined, and the card says when a reward is ready.",
    icon: QrCode,
  },
] as const;

/**
 * The card, both sides.
 *
 * A button rather than a div with a click handler: turning it over is an
 * action, it needs to work from the keyboard, and `aria-pressed` is what tells
 * a screen reader which side is showing.
 */
function WalletCardVisual() {
  const [flipped, setFlipped] = useState(false);
  const brand = BRAND_COLORS.ink;

  const face = (
    <div
      className="relative aspect-[85.6/53.98] overflow-hidden rounded-[16px] px-6 py-6"
      style={{
        background: brand.background,
        color: brand.foreground,
        boxShadow: "0 22px 60px rgb(24 18 12 / 26%)",
        // Named here so the mixes below read the card's own ink rather than
        // assuming a dark ground, exactly as the customer app does.
        ["--card-ink" as string]: brand.foreground,
      }}
    >
      {/* Low and to the right, behind the stamps rather than through the
          status pill - the ring was cutting the pill in half. */}
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -right-16 size-48 rounded-full border-[26px] border-[var(--accent)] opacity-25"
      />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 place-items-center rounded-2xl"
              style={{ background: ink(12) }}
            >
              <Stamp size={20} />
            </span>
            <div>
              <p className="text-base font-extrabold tracking-[-0.025em]">Sweet Crumbs</p>
              <p className="mt-0.5 text-[11px]" style={{ color: ink(62) }}>
                Bakery
              </p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em]"
            style={{ border: `1px solid ${ink(24)}`, color: ink(72) }}
          >
            Regular
          </span>
        </div>
        <div>
          <p className="max-w-[19ch] text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">
            3 more visits, then free pastry.
          </p>
          <div className="mt-5 flex gap-1.5" role="img" aria-label="Five of eight stamps collected">
            {Array.from({ length: 8 }, (_, index) => (
              <span
                key={index}
                className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold"
                style={
                  index < 5
                    ? { background: "var(--accent)", color: "var(--ink)" }
                    : { border: `1px dashed ${ink(32)}`, color: ink(40) }
                }
              >
                {index < 5 ? "K" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const back = (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-[16px] px-6 py-6"
      style={{
        background: brand.background,
        color: brand.foreground,
        boxShadow: "0 22px 60px rgb(24 18 12 / 26%)",
        ["--card-ink" as string]: brand.foreground,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: ink(62) }}
          >
            Member
          </p>
          <p className="mt-1 text-base font-extrabold tracking-[-0.025em]">Jacqueline Daniel</p>
          <p className="mt-1 font-mono text-[11px]" style={{ color: ink(72) }}>
            {/* A real code: thirteen digits, check digit valid. */}
            2912 4077 0315 7
          </p>
        </div>
        {/* A white plate under the symbol on purpose: a scanner needs the
            contrast, and no brand ground would give it one. */}
        <span className="grid size-[76px] shrink-0 place-items-center rounded-xl bg-white p-2">
          <QrCode size={56} className="text-[var(--ink)]" aria-hidden="true" />
        </span>
      </div>
      <p className="text-[11px] font-semibold" style={{ color: ink(62) }}>
        Show this at the counter &middot; no expiry
      </p>
    </div>
  );

  return (
    <div>
      <div className="flip-card mx-auto w-full max-w-[420px]" data-flipped={flipped}>
        <div className="flip-card-mover">
          <div className="flip-card-face flip-card-front">{face}</div>
          <div className="flip-card-face flip-card-back">{back}</div>
        </div>
      </div>
      <button
        type="button"
        aria-pressed={flipped}
        onClick={() => setFlipped((current) => !current)}
        className="focus-ring mx-auto mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold text-[var(--muted-strong)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {flipped ? "Show the stamps" : "Turn the card over"}
      </button>
    </div>
  );
}

/** The phone, showing whichever step the reader has selected. */
function PhoneMock({ step }: { step: number }) {
  return (
    <div className="mx-auto w-[280px] rounded-[38px] border-[10px] border-[var(--ink)] bg-[var(--paper)] shadow-[0_30px_90px_rgb(24_18_12/28%)]">
      <div className="flex h-[520px] flex-col overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <span className="font-mono text-[9px] font-bold text-[var(--muted)]">9:41</span>
          <span className="h-1.5 w-10 rounded-full bg-[var(--line-strong)]" />
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--accent)]">
              <ScanLine size={30} />
            </span>
            <div className="grid size-36 place-items-center rounded-2xl border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface)]">
              <QrCode size={78} className="text-[var(--ink)]" aria-hidden="true" />
            </div>
            <p className="text-sm font-extrabold">Sweet Crumbs</p>
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              Point the camera at the code on the counter.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)]">
              <Check size={32} strokeWidth={3} />
            </span>
            <p className="text-lg font-extrabold leading-tight">
              That is your first stamp.
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className={`size-5 rounded-full ${index === 0 ? "bg-[var(--accent)]" : "border border-dashed border-[var(--line-strong)]"}`}
                />
              ))}
            </div>
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              Kept for you now. Add your number whenever you like and it
              follows you.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 px-4 pt-3">
            <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
              My wallet
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                { name: "Sweet Crumbs", meta: "5 of 8 · Free pastry", tone: "var(--ink)", fg: "var(--paper)" },
                { name: "Brew Point Coffee", meta: "240 points", tone: "var(--accent)", fg: "var(--ink)" },
                { name: "Rooted Studio", meta: "Reward ready", tone: "var(--success)", fg: "var(--paper)" },
              ].map((card) => (
                <div
                  key={card.name}
                  className="rounded-2xl px-4 py-3.5"
                  style={{ background: card.tone, color: card.fg }}
                >
                  <p className="text-sm font-extrabold tracking-[-0.02em]">{card.name}</p>
                  <p className="mt-0.5 text-[11px] opacity-70">{card.meta}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              Every shop, one place. Each card in that shop&apos;s own colour.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgb(24_18_12/16%)]">
              <QrCode size={120} className="text-[var(--ink)]" aria-hidden="true" />
            </div>
            <p className="font-mono text-xs font-bold">2912 4077 0315 7</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--paper)]">
              <Sparkles size={12} /> Free pastry ready
            </span>
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              One code, every business they have joined.
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-around border-t border-[var(--line)] bg-[var(--surface)] py-2.5 text-[9px] font-bold text-[var(--muted)]">
          <span className={step === 2 ? "text-[var(--ink)]" : ""}>Wallet</span>
          <span>Discover</span>
          <span className={step === 3 ? "text-[var(--ink)]" : ""}>Code</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
}

export function VirtualCard() {
  const [step, setStep] = useState(0);

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SiteEyebrow>The virtual card</SiteEyebrow>
            <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              The card lives on their phone.
            </h2>
          </div>
          <p className="max-w-[56ch] self-end text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
            One side shows how close they are to the reward, the other is the
            code the counter scans. It carries your colour and your storefront,
            it never expires, and there is nothing to install.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-8">
            <WalletCardVisual />
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--line)] pt-6">
              {[
                ["Runs on", "Any phone browser"],
                ["Expiry", "None"],
                ["Card art", "Yours, per shop"],
                ["One code", "Works at every shop"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-10 sm:grid-cols-[1.1fr_auto] sm:items-center">
            <ol className="space-y-2">
              {STEPS.map((entry, index) => {
                const Icon = entry.icon;
                const active = index === step;
                return (
                  <li key={entry.title}>
                    <button
                      type="button"
                      aria-current={active ? "step" : undefined}
                      onClick={() => setStep(index)}
                      className={`focus-ring flex w-full gap-4 rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                          active
                            ? "bg-white/10 text-[var(--accent)]"
                            : "bg-[var(--surface-2)] text-[var(--muted-strong)]"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold tracking-[-0.01em]">
                          {index + 1}. {entry.title}
                        </span>
                        <span
                          className={`mt-1 block text-xs leading-relaxed ${active ? "text-white/70" : "text-[var(--muted-strong)]"}`}
                        >
                          {entry.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <PhoneMock step={step} />
          </div>
        </div>
      </div>
    </section>
  );
}
