"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBusinessProfile, useLocations, usePrograms } from "@kypstamping/api";
import { Button, Eyebrow, Skeleton, ViewFrame } from "@kypstamping/ui";
import { PlanTag } from "@kypstamping/ui/shell";
import { Copy, CreditCard, Eye, Link2, Nfc, Printer, Send, ShieldCheck, Smartphone, WalletCards, WifiOff } from "lucide-react";
import { useRaiseSupportRequest } from "@/components/mutations";
import type { Notify } from "@/components/views/shared";

/**
 * Where a printed poster points: the wallet, never a literal host.
 *
 * The promise is that the stamp appears on scan. Landing on a marketing page
 * with a "continue to join" button is the interstitial this flow exists to
 * remove.
 */
const POSTER_ORIGIN = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "https://app.kyp.ph";

/**
 * The slug form the API used before it stored one per branch. Only a branch
 * the API has no stored slug for falls back to it.
 */
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A real QR symbol from the `qrcode` package, at print error correction: a
 * poster gets scuffed, curled and photographed at an angle.
 */
export function JoinPosterCode({ url, size = 280 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void import("qrcode")
      .then((module) =>
        module.default.toDataURL(url, {
          width: 640,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#181210", light: "#ffffff" },
        }),
      )
      .then((dataUrl) => {
        if (live) setSrc(dataUrl);
      })
      .catch(() => {
        if (live) setSrc(null);
      });
    return () => {
      live = false;
    };
  }, [url]);

  if (!src) return <Skeleton className="" />;

  return (
    // A data: URL generated in the browser has nothing for the image
    // optimiser to do, and next/image cannot handle one anyway.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`QR code linking to ${url}`} width={size} height={size} style={{ width: size, height: size }} />
  );
}

type Layout = "poster" | "sticker" | "tent";
const LAYOUTS: { id: Layout; label: string; detail: string }[] = [
  { id: "poster", label: "Poster", detail: "A4, for the wall or the counter" },
  { id: "sticker", label: "Sticker", detail: "A small square for the door or the register" },
  { id: "tent", label: "Table tent", detail: "A5 folded, one side per seat" },
];

type Copy = {
  shop: string;
  branch: string;
  url: string;
  welcome: string;
  reward: string;
};

function PosterSheet({ copy }: { copy: Copy }) {
  return (
    <div className="print-sheet mx-auto max-w-[520px] text-center text-black">
      <p className="text-sm font-extrabold uppercase tracking-[0.2em]">{copy.shop}</p>
      <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-[-0.03em]">Collect stamps here.</h1>
      <p className="mt-4 text-lg font-bold">{copy.branch}</p>
      <div className="mx-auto mt-10 w-fit border-4 border-black p-6">
        <JoinPosterCode url={copy.url} size={280} />
      </div>
      <p className="mt-8 text-base font-extrabold">Scan with your phone camera</p>
      <p className="mt-2 text-sm font-bold">{copy.welcome}</p>
      <p className="mt-1 text-sm">{copy.reward}</p>
      <p className="mt-6 break-all text-xs">{copy.url}</p>
      <p className="mt-10 text-[10px] uppercase tracking-[0.18em]">No app needed · You choose what to share</p>
    </div>
  );
}

function StickerSheet({ copy }: { copy: Copy }) {
  return (
    <div className="print-sheet grid place-items-center text-black">
      <div className="grid w-[80mm] place-items-center border-2 border-dashed border-black p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]">{copy.shop}</p>
        <div className="mt-2">
          <JoinPosterCode url={copy.url} size={200} />
        </div>
        <p className="mt-2 text-sm font-extrabold">Scan to join</p>
        <p className="text-[10px] font-bold">{copy.welcome}</p>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-[0.18em]">Cut along the dashed line · 80 mm square</p>
    </div>
  );
}

function TentPanel({ copy, flipped }: { copy: Copy; flipped: boolean }) {
  return (
    <div className={`grid h-[128mm] place-items-center text-center text-black ${flipped ? "rotate-180" : ""}`}>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]">{copy.shop}</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">Collect stamps here.</h2>
        <div className="mx-auto mt-4 w-fit border-2 border-black p-3">
          <JoinPosterCode url={copy.url} size={160} />
        </div>
        <p className="mt-3 text-sm font-extrabold">Scan with your phone camera</p>
        <p className="text-xs font-bold">{copy.welcome}</p>
        <p className="text-xs">{copy.reward}</p>
      </div>
    </div>
  );
}

/** A4 portrait folded once across the middle is an A5 tent; the top half
 *  prints upside down so both seats read it the right way up. */
function TentSheet({ copy }: { copy: Copy }) {
  return (
    <div className="print-sheet mx-auto w-[180mm]">
      <TentPanel copy={copy} flipped />
      <div className="my-2 border-t border-dashed border-black text-center text-[9px] uppercase tracking-[0.18em] text-black">
        fold here
      </div>
      <TentPanel copy={copy} flipped={false} />
    </div>
  );
}

/** The three sheets, mounted at the body so the app chrome stays off paper. */
function PrintSheets({ copy }: { copy: Copy }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Portals need the document, which the server render does not have.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="print-root hidden print:block">
      <PosterSheet copy={copy} />
      <StickerSheet copy={copy} />
      <TentSheet copy={copy} />
    </div>,
    document.body,
  );
}

export function JoinCodeView({ notify }: { notify: Notify }) {
  const [nfcOpen, setNfcOpen] = useState(false);
  const [layout, setLayout] = useState<Layout>("poster");
  const quote = useRaiseSupportRequest();
  const { data: locations = [] } = useLocations();
  const { data: profile } = useBusinessProfile();
  const { data: programs = [] } = usePrograms();
  const [branch, setBranch] = useState<string | null>(null);

  const selected = branch ?? locations[0]?.name ?? "";
  // The API's stored slug: unique across shops and kept through renames, so
  // a poster printed today still works after the shop changes its name.
  const selectedLocation = locations.find((location) => location.name === selected);
  const slug =
    selectedLocation?.posterSlug ?? `${slugify(profile?.shortName ?? "")}-${slugify(selected)}`;
  const joinUrl = `${POSTER_ORIGIN}/join/${slug}`;
  const ready = Boolean(
    selectedLocation?.posterSlug || (slugify(profile?.shortName ?? "") && slugify(selected)),
  );
  const stampCard = programs.find((program) => program.type === "Stamps" && program.status === "Live");
  // The rule as the program carries it; the product default is on.
  const welcome = stampCard?.rules?.welcomeStamp ?? true;
  const copy: Copy = {
    shop: profile?.shortName ?? "",
    branch: selected,
    url: joinUrl,
    welcome: welcome
      ? "A welcome stamp is waiting for you, pending until your first visit."
      : "Join and start collecting on your first visit.",
    reward: stampCard
      ? `${stampCard.target} ${stampCard.target === 1 ? "visit" : "visits"} → ${stampCard.rewardName}`
      : "",
  };

  if (!ready) {
    return (
      <ViewFrame
        eyebrow="Enrollment"
        title="My join code"
        description="A poster needs your shop's name and at least one branch. Finish setting up and the code appears here."
      >
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-sm font-extrabold">Not ready to print yet</p>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Add your business name and a branch first. A code printed before then points at nothing, and a customer scanning it is told the counter code is not one we recognise.
          </p>
        </section>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Enrollment"
      title="My join code"
      description="One public code, everywhere: poster, sticker, table tent, receipt, Facebook bio. It grants a membership and a pending welcome stamp, nothing of value, so it does not matter how far it spreads."
      action={
        <span className="flex items-center gap-2">
          <PlanTag plan="Launch" included />
          <Button icon={<Printer size={16} />} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </span>
      }
    >
      <PrintSheets copy={copy} />

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          <label className="grid gap-2 text-xs font-bold">
            Branch
            <select
              value={selected}
              onChange={(event) => setBranch(event.target.value)}
              className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-sm outline-none"
            >
              {locations.map((location) => (
                <option key={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
          <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Layout">
            {LAYOUTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={layout === option.id}
                onClick={() => setLayout(option.id)}
                className={`rounded-xl border p-3 text-left ${layout === option.id ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
              >
                <span className="block text-sm font-extrabold">{option.label}</span>
                <span className={`mt-0.5 block text-[10px] ${layout === option.id ? "text-white/60" : "text-[var(--muted)]"}`}>{option.detail}</span>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_45px_rgb(24_18_12/10%)]">
            {layout === "poster" && <PosterSheet copy={copy} />}
            {layout === "sticker" && <StickerSheet copy={copy} />}
            {layout === "tent" && <TentSheet copy={copy} />}
          </div>
          <p className="mt-4 text-center text-[11px] text-[var(--muted)]">
            Printing saves all three layouts as one PDF, a page each, A4. The QR encodes {joinUrl}.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              icon={<Copy size={15} />}
              onClick={() => {
                navigator.clipboard?.writeText(joinUrl).catch(() => {});
                notify("Join link copied.");
              }}
            >
              Copy link
            </Button>
            <Button tone="quiet" icon={<Nfc size={15} />} aria-expanded={nfcOpen} onClick={() => setNfcOpen((open) => !open)}>
              {nfcOpen ? "Hide NFC steps" : "Set up NFC"}
            </Button>
          </div>
          {nfcOpen && (
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <Eyebrow>Writing a tag</Eyebrow>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-[var(--muted-strong)]">
                <li>Open any NFC writer app on an Android phone, or NFC Tools on iPhone.</li>
                <li>Choose <strong>Write &rarr; URL</strong> and paste the join link.</li>
                <li>Hold the tag to the back of the phone until it confirms.</li>
                <li>Tap it with another phone to check it opens {profile?.shortName ?? "your"} sign-up.</li>
              </ol>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(joinUrl).catch(() => {});
                  notify("Join link copied. Paste it into the writer app.");
                }}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line-strong)] px-4 text-xs font-extrabold"
              >
                <Copy size={14} /> Copy the link again
              </button>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <CreditCard size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">Printed member cards</p>
                  <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-[var(--muted-strong)]">
                    Wallet-sized cards carrying each customer&rsquo;s own code, for customers without a smartphone or when data is down. Staff scan the printed card exactly like the in-app code.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                Quoted separately
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                tone="quiet"
                icon={<Send size={15} />}
                disabled={quote.isPending}
                onClick={() =>
                  quote.mutate(
                    {
                      subject: "Printed member cards",
                      detail: `Quote request for printed cards from ${profile?.name ?? "this workspace"}.`,
                      category: "Billing",
                    },
                    {
                      onSuccess: () => notify("Quote requested. Someone will reply by email."),
                      onError: (failure) => notify(failure.message, "error"),
                    },
                  )
                }
              >
                {quote.isPending ? "Requesting…" : "Request a quote"}
              </Button>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-[var(--line-strong)] px-4 text-xs font-bold text-[var(--muted-strong)]">
                <WalletCards size={15} /> Wallet passes need Apple and Google certificates
              </span>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
          <Eyebrow>What customers see</Eyebrow>
          <h2 className="mt-5 max-w-[13ch] text-3xl font-extrabold tracking-[-0.02em]">Join in under thirty seconds.</h2>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              { icon: Eye, title: "Clear program terms", text: `${copy.reward || "The reward"}, the cooldown and any minimum spend, before joining.` },
              { icon: ShieldCheck, title: "Purpose-by-purpose choice", text: "Joining is not consent to marketing. Promotions, email, SMS, push and location are separate controls." },
              { icon: Smartphone, title: "No app-store gate", text: "The wallet opens in the browser and can be installed later." },
              { icon: WifiOff, title: "Works without a signal", text: "Customers can save or print their code, or carry a printed member card, and still be scanned." },
              { icon: Link2, title: "One identity, private by design", text: "The business receives only the customer details approved for this program." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-white/50">
            {welcome
              ? "The welcome stamp lands marked pending and becomes real when your staff confirm the first visit, which earns its own stamp too: the card reads two."
              : "The welcome stamp is switched off on this card, so the poster promises nothing but the card itself."}
          </p>
        </section>
      </div>
    </ViewFrame>
  );
}
