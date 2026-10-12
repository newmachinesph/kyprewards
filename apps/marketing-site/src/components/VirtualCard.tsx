"use client";

/**
 * What the customer actually holds, and how they use it.
 *
 * The site described the wallet in prose and never showed it — a visitor
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
  Croissant,
  QrCode,
  RefreshCw,
  ScanLine,
  Smartphone,
  Stamp,
} from "lucide-react";
import Image from "next/image";
import { BRAND_COLORS, StampDots } from "@kyprewards/ui";
import { SiteEyebrow } from "./MarketingUi";

/** Ink at a strength, against whatever ground the card is on. */
const ink = (percent: number) =>
  `color-mix(in oklab, var(--card-ink) ${percent}%, transparent)`;

const STEPS = [
  {
    title: "Scan the code on the counter",
    detail:
      "A poster or a card by the till. It opens in the browser they already have: no app store, no download, nothing to install.",
    icon: ScanLine,
  },
  {
    title: "Join, and a welcome stamp is waiting",
    detail:
      "One mobile number, and a pending stamp lands on the card straight away, so they see it before they've bought anything. It becomes real when staff confirm their first visit, which means a photo of the poster earns nobody a thing.",
    icon: Stamp,
  },
  {
    title: "The card lives in their wallet",
    detail:
      "Every shop they join keeps its own card in one place, with the shop's own color and photo. Nothing to carry, nothing to lose, and the card itself never expires.",
    icon: Smartphone,
  },
  {
    title: "Show the code, collect the reward",
    detail:
      "Turn the card over for a scannable member code. The same code works at every business they've joined. When a reward is ready, the card says so and asks them to approve it before staff release it.",
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

  // The shop's own skin, the way a merchant sets it up: their storefront
  // photo behind the card, their mark on every stamp. Sweet Crumbs is the
  // demo bakery the whole product ships with.
  const shell = {
    background: brand.background,
    color: brand.foreground,
    boxShadow: "0 22px 60px rgb(24 18 12 / 26%)",
    // Named here so the mixes below read the card's own ink rather than
    // assuming a dark ground, exactly as the customer app does.
    ["--card-ink" as string]: brand.foreground,
  };

  const face = (
    <div className="relative aspect-[85.6/53.98] overflow-hidden rounded-[16px]" style={shell}>
      <Image
        src="/images/cards/sweet-crumbs-storefront.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="(min-width: 640px) 420px, 90vw"
        className="object-cover object-[72%_45%]"
      />
      {/* Dark where the words sit, the counter showing through on the right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgb(24_18_12/96%)_0%,rgb(24_18_12/86%)_40%,rgb(24_18_12/40%)_72%,rgb(24_18_12/12%)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(24_18_12/88%),transparent)]"
      />
      <div className="relative flex h-full flex-col justify-between px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)] shadow-[0_6px_18px_rgb(0_0_0/30%)]">
              <Croissant size={22} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-extrabold tracking-[-0.025em]">
                Sweet Crumbs
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: ink(70) }}>
                Bakery
              </p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm"
            style={{ border: `1px solid ${ink(30)}`, color: ink(80), background: "rgb(24 18 12 / 35%)" }}
          >
            Regular
          </span>
        </div>
        <div>
          <p className="max-w-[19ch] text-2xl font-extrabold leading-[1.05] tracking-[-0.02em] [text-shadow:0_2px_12px_rgb(0_0_0/45%)]">
            3 more visits, then free pastry.
          </p>
          <div className="mt-5" aria-label="Five of eight stamps collected" role="img">
            <StampDots
              filled={5}
              total={8}
              dark
              mark={<Croissant size={13} strokeWidth={2.4} aria-hidden="true" />}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const back = (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-[16px] px-6 py-6"
      style={shell}
    >
      {/* The same storefront, barely there: the back is for scanning. */}
      <Image
        src="/images/cards/sweet-crumbs-storefront.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="(min-width: 640px) 420px, 90vw"
        className="object-cover object-[72%_45%] opacity-[0.14]"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: ink(62) }}
          >
            Member
          </p>
          <p className="mt-1 text-base font-extrabold tracking-[-0.025em]">
            Jacqueline Daniel
          </p>
          <p className="mt-1 font-mono text-[11px]" style={{ color: ink(72) }}>
            {/* A real code: thirteen digits, check digit valid. */}
            2912 4077 0315 7
          </p>
        </div>
        {/* A white plate under the symbol on purpose: a scanner needs the
            contrast, and no brand ground would give it one. The symbol is
            the real code above, so a phone pointed at the site reads it. */}
        <span className="grid size-[84px] shrink-0 place-items-center rounded-xl bg-white p-2">
          <Image
            src="/images/cards/member-qr.svg"
            alt="Member QR code"
            width={68}
            height={68}
            unoptimized
          />
        </span>
      </div>
      {/* The same code as a barcode, for tills with a laser scanner. */}
      <span className="relative block h-11 w-[64%] rounded-lg bg-white px-3 py-2">
        <Image
          src="/images/cards/member-barcode.svg"
          alt="Member barcode"
          fill
          unoptimized
          className="!static !h-full !w-full"
        />
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold" style={{ color: ink(62) }}>
          Show this at the counter &middot; no expiry
        </p>
        <span className="grid size-7 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)]">
          <Croissant size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div
        className="flip-card mx-auto w-full max-w-[420px]"
        data-flipped={flipped}
      >
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

/**
 * Screenshots of the real wallet, one per step, taken from the customer app
 * against the demo shop. Re-shoot them when the wallet changes.
 */
const SCREENS = [
  { src: "/images/wallet/join.webp", alt: "The page the counter code opens: the first stamp, one of eight toward a free pastry, and a button to save it" },
  { src: "/images/wallet/pending-stamp.webp", alt: "The wallet after joining: the Sweet Crumbs card with one stamp pending until the first visit" },
  { src: "/images/wallet/wallet-home.webp", alt: "The wallet home: the Sweet Crumbs card in the shop's own photo, five of eight stamps" },
  { src: "/images/wallet/member-code.webp", alt: "The member code screen: a QR code and barcode to show at the counter" },
] as const;

/** The phone, showing whichever step the reader has selected. */
function PhoneMock({ step }: { step: number }) {
  const screen = SCREENS[step] ?? SCREENS[0];
  return (
    <div className="mx-auto w-[280px] rounded-[38px] border-[10px] border-[var(--ink)] bg-[var(--paper)] shadow-[0_30px_90px_rgb(24_18_12/28%)]">
      <div className="relative aspect-[390/844] overflow-hidden rounded-[28px]">
        <Image
          key={screen.src}
          src={screen.src}
          alt={screen.alt}
          fill
          sizes="260px"
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

export function VirtualCard() {
  const [step, setStep] = useState(0);

  return (
    <section className="px-4 pt-20 pb-32 sm:px-6 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
          <SiteEyebrow>The virtual card</SiteEyebrow>
          <h2 className="mt-5 max-w-[16ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
            The card lives on their phone.
          </h2>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
            One side shows how close they are to the reward, the other is the
            code the counter scans. It carries your color and your storefront,
            the card never expires, and there is nothing to install.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* `min-w-0`: a grid item's default min-width is auto, so the card
              inside refused to shrink and forced this panel to 380px on a
              320px phone - the page scrolled sideways and the panel's right
              edge was off it. */}
          <div className="panel shadow-soft min-w-0 border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
            <WalletCardVisual />
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--line)] pt-6">
              {[
                ["Runs on", "Any phone browser"],
                ["Card expiry", "Never"],
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
