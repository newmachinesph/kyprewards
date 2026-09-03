"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { DiscoverPlace, WalletCard } from "@kypstamping/api";
import {
  ApiError,
  PREVIEW_WRITE_REASON,
  getDataExportLink,
  isPreview,
  useActivity,
  useConsentHistory,
  useCustomerProfile,
  useDataRequests,
  useDiscover,
  useNearby,
  useNotifications,
  usePendingApprovals,
} from "@kypstamping/api";
import {
  brandColor,
  BrandMark,
  Eyebrow,
  PreviewBadge,
  QueryBoundary,
  Skeleton,
  StampDots,
} from "@kypstamping/ui";
import { signOut } from "@kypstamping/ui/auth";
import { Toast, useToast } from "@kypstamping/ui/shell";
import {
  formatDistance,
  formatMemberCode,
  greeting,
  longDate,
  relativeTime,
  todayLabel,
} from "@kypstamping/ui/format";

/** A place is "nearby" within a 1.5 km walk. */
const NEARBY_METRES = 1500;
/** Where the legal pages and the merchant door live. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const MARKETPLACE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? "";
import { useCoordinates } from "@/components/useCoordinates";
import {
  CHANNELS,
  CustomerStateProvider,
  useCustomerState,
} from "@/components/CustomerState";
import { SheetHeader } from "@/components/Sheet";
import { ApproveSheet } from "@/components/ApproveSheet";
import { GiftsSheet } from "@/components/GiftsSheet";
import { PushSection } from "@/components/PushSection";
import { Barcode } from "@/components/Barcode";
import {
  CardStatus,
  CardTerms,
  MissionList,
  PromoCodeEntry,
  StoreCreditLine,
  cardStateLine,
  earnedStamps,
} from "@/components/cards";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CakeSlice,
  Check,
  ChevronRight,
  Coffee,
  Clock,
  Coins,
  Compass,
  Croissant,
  BadgeCheck,
  Crown,
  Download,
  Dumbbell,
  ExternalLink,
  Gift,
  Home,
  History,
  Leaf,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Nfc,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trash2,
  UserRound,
  WalletCards,
  WifiOff,
  X,
} from "lucide-react";

type Tab = "home" | "wallet" | "discover" | "profile";
type ProfileScreen =
  | "personal"
  | "notifications"
  | "privacy"
  | "businesses"
  | "consent"
  | "export"
  | "danger";
type Sheet =
  | { kind: "notifications" }
  | { kind: "activity" }
  | { kind: "approve" }
  | { kind: "gifts" }
  | { kind: "business"; id: string }
  | { kind: "wallet"; id: string; programId: string }
  | { kind: "profile"; title: string; screen: ProfileScreen }
  | null;

const categoryIcons: Record<string, typeof Coffee> = {
  Bakery: Croissant,
  Café: Coffee,
  Wellness: Leaf,
  Fitness: Dumbbell,
  Retail: Gift,
  Grooming: UserRound,
};



/**
 * The member code as a real, scannable symbol.
 *
 * A hand-drawn bitmap is not one - QR needs finder patterns and Reed-Solomon
 * correction, which is not worth hand-rolling.
 *
 * `forPrint` raises the correction level from M (15%) to Q (25%) and widens
 * the quiet zone. A symbol on a screen is pristine and gets one scan attempt
 * on a clean surface; the same symbol saved, printed and carried in a wallet
 * is creased and scuffed, and the extra redundancy is what still reads it. It
 * costs a denser symbol, which only matters when the print is small.
 *
 * Black on white, always. Amber bars would be invisible to a red-light laser
 * scanner, which sees anything in the red end of the spectrum as background.
 */
async function renderQrDataUrl(memberCode: string, size: number, forPrint = false) {
  // The rendered symbol is kept on the device, so the code opens at the
  // counter with no signal even when the codec chunk cannot be fetched.
  const cacheKey = `kyp-qr-${memberCode}-${size}-${forPrint ? "p" : "s"}`;
  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Storage unavailable; render every time.
  }
  const QRCode = (await import("qrcode")).default;
  const url = await QRCode.toDataURL(memberCode, {
    width: size,
    // Four modules is the spec minimum for a printed symbol; two is fine on a
    // screen, where nothing crops it.
    margin: forPrint ? 4 : 2,
    errorCorrectionLevel: forPrint ? "Q" : "M",
    color: { dark: "#181210", light: "#ffffff" },
  });
  try {
    window.localStorage.setItem(cacheKey, url);
  } catch {
    // A full or private store. The symbol still renders this time.
  }
  return url;
}

async function saveQrImage(memberCode: string) {
  try {
    const url = await renderQrDataUrl(memberCode, 720, true);
    const link = document.createElement("a");
    link.download = `kypstamping-${memberCode}.png`;
    link.href = url;
    link.click();
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull the `qrcode` chunk down while the wallet is still online.
 *
 * The codec is a dynamic import, and the service worker only caches assets
 * once they have been fetched. Without this, a customer who installs the PWA
 * and never opens their code while online gets nothing at the counter — the
 * one moment the product promises works with no signal.
 */
function usePrefetchQrCodec(memberCode: string) {
  useEffect(() => {
    if (!memberCode) {
      void import("qrcode").catch(() => undefined);
      return;
    }
    // Render the screen symbol now, while online, so the first offline open
    // reads it from the device rather than from a chunk that may not be there.
    void renderQrDataUrl(memberCode, 560).catch(() => undefined);
  }, [memberCode]);
}

/**
 * Keep the screen awake and lit while the code is on it.
 *
 * The web cannot set brightness, but it can stop the screen dimming - and a
 * screen that dims mid-queue is the ordinary reason a phone QR will not scan.
 * Released on unmount, and re-taken when the tab comes back, because the
 * browser drops the lock whenever the page is hidden.
 *
 * Unsupported everywhere except Chromium, so every call is guarded: on a
 * browser without it the code still shows, it just dims as usual.
 */
function useScreenAwake() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const take = async () => {
      try {
        sentinel = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Denied, unsupported, or the tab was already hidden. Nothing to do -
        // this is a convenience, not a requirement.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void take();
    };

    void take();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);
}

function QrImage() {
  const { data: profile } = useCustomerProfile();
  const memberCode = profile?.memberCode ?? "";
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "ready"; src: string } | { kind: "failed" }
  >({ kind: "loading" });

  useEffect(() => {
    let active = true;
    renderQrDataUrl(memberCode, 560)
      .then((url) => {
        if (active) setState({ kind: "ready", src: url });
      })
      .catch(() => {
        if (active) setState({ kind: "failed" });
      });
    return () => {
      active = false;
    };
    // The code comes from the profile request, so the symbol has to be
    // rendered again once it answers - before that it would encode "".
  }, [memberCode]);

  if (state.kind === "loading") {
    return (
      <div
        className="size-[196px] rounded-lg bg-[var(--surface-2)] motion-safe:animate-pulse"
        aria-hidden="true"
      />
    );
  }

  // Silence here would look like a slow load forever. Staff can still key in
  // the member code below, so say that rather than showing an empty box.
  if (state.kind === "failed") {
    return (
      <div className="grid size-[196px] place-items-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-4 text-center">
        <div>
          <WifiOff
            size={22}
            className="mx-auto text-[var(--muted-strong)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-xs font-extrabold">Code image unavailable</p>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
            Read the member code below to staff, or reconnect to load the
            scannable image.
          </p>
        </div>
      </div>
    );
  }

  const src = state.src;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a generated data: URI, not an optimisable asset
    <img
      src={src}
      alt={`Loyalty code ${formatMemberCode(memberCode)}`}
      width={196}
      height={196}
      className="size-[196px]"
    />
  );
}

/**
 * The card the customer is closest to finishing.
 *
 * Everything here comes from their wallet. It used to recite the demo
 * fixture, so a customer holding one stamp was shown five, with somebody
 * else's last visit and a transaction id that was not theirs.
 */
/**
 * How full the card is, or null when the programme has no finish line.
 *
 * Points and cashback run forever; dividing by their target of zero gives
 * Infinity, which clamps to a full bar on a balance of five.
 */
function percentOf(card: WalletCard): number | null {
  if (card.target <= 0) return null;
  // Earned stamps only: a pending welcome stamp is not progress yet.
  return Math.min(100, Math.round((earnedStamps(card) / card.target) * 100));
}

/**
 * Ink at a given strength, against whatever ground this card is on.
 *
 * The card used to be one fixed dark ticket, so every secondary line was
 * `text-white/50`. A merchant on the paper or amber token would have had white
 * text on a near-white card. Everything soft is now mixed from the card's own
 * foreground instead.
 */
const walletIcons: Record<string, typeof Coins> = {
  Stamps: Croissant,
  Points: Coins,
  Membership: Crown,
  "Gift card": Gift,
};

const cardInk = (percent: number) =>
  `color-mix(in oklab, var(--card-ink) ${percent}%, transparent)`;

/**
 * One shop's card, with both sides of it.
 *
 * The progress is the side worth seeing while scrolling a wallet; the member
 * code is the side worth having at the counter, and it used to live on a
 * different screen entirely - so a customer paying for coffee had to leave
 * their card to show who they were. Now it is the same object, turned over.
 */
function LoyaltyCard({
  card,
  compact = false,
}: {
  card: WalletCard;
  compact?: boolean;
}) {
  const { data: profile } = useCustomerProfile();
  const [flipped, setFlipped] = useState(false);
  // The QR codec is a dynamic import and a card that is never turned over
  // never needs it. A wallet of eight cards would otherwise render eight
  // symbols nobody asked to see.
  const [everFlipped, setEverFlipped] = useState(false);
  const brand = brandColor(card.color);

  // Null on a programme with no target: "0 more visits, then ." is what the
  // subtraction produced for a points balance before this.
  const remaining = card.target > 0 ? Math.max(0, card.target - card.progress) : null;
  const Icon = walletIcons[card.kind] ?? WalletCards;

  const surface = (
    <article
      className="loyalty-ticket relative overflow-hidden rounded-2xl px-5 py-5"
      style={
        {
          "--card-brand": brand.background,
          "--card-ink": brand.foreground,
          color: "var(--card-ink)",
        } as CSSProperties
      }
    >
      {/* The shop's own storefront, if they gave one. Low enough that the
          card stays a card rather than a photo with text on it, and absent
          entirely rather than a placeholder when they have not. */}
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- a presigned URL that changes on every sign, not an optimisable asset
        <img
          src={card.imageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.18]"
        />
      )}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 place-items-center rounded-2xl"
              style={{ background: cardInk(12) }}
            >
              <Icon size={22} />
            </span>
            <div>
              <p className="text-base font-extrabold tracking-[-0.025em]">{card.business}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: cardInk(62) }}>
                {card.category}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em]"
            style={{ border: `1px solid ${cardInk(24)}`, color: cardInk(72) }}
          >
            {card.state ?? card.status}
          </span>
        </div>
        {!compact && (
          <p className="mt-7 max-w-[19ch] text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">
            {/* "Ready" means a reward exists, not that the bar looks full.
                Rewards are minted when they are earned, so a shop that lowers
                its target below what people already hold leaves them all
                reading a finished card that the till then refuses. */}
            {card.state === "pending"
              ? "Your welcome stamp lands on your first visit."
              : card.state === "closed"
                ? card.rewardsAvailable > 0
                  ? `${card.reward} is held for you.`
                  : "This run has closed."
                : remaining === null
                  ? card.balance
                  : card.rewardsAvailable > 0
                    ? `${card.reward} is ready.`
                    : remaining === 0
                      ? `${card.reward} on your next visit.`
                      : `${remaining} more ${remaining === 1 ? "visit" : "visits"}, then ${card.reward.toLowerCase()}.`}
          </p>
        )}
        <div className={compact ? "mt-5" : "mt-7"}>
          {card.target > 0 && (
            <div className="overflow-x-auto pb-1">
              <StampDots filled={earnedStamps(card)} total={card.target} dark />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
            <span style={{ color: cardInk(62) }}>
              {card.state === "pending" ? `${earnedStamps(card)} of ${card.target} · 1 pending` : card.balance}
            </span>
            <span>{card.reward}</span>
          </div>
          <CardStatus card={card} onCard />
        </div>
      </div>
    </article>
  );

  // In a dense list the card is a summary, not something to operate.
  if (compact || !profile) return surface;

  return (
    <div className="flip-card" data-flipped={flipped}>
      <div className="flip-card-mover">
        <div className="flip-card-face flip-card-front">{surface}</div>
        <div className="flip-card-face flip-card-back">
          <article
            className="loyalty-ticket flex h-full flex-col justify-between overflow-hidden rounded-2xl px-5 py-5"
            style={
              {
                "--card-brand": brand.background,
                "--card-ink": brand.foreground,
                color: "var(--card-ink)",
              } as CSSProperties
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: cardInk(62) }}>
                  Member
                </p>
                <p className="mt-1 text-base font-extrabold tracking-[-0.025em]">
                  {profile.name}
                </p>
                <p className="mt-1 font-mono text-[11px]" style={{ color: cardInk(72) }}>
                  {formatMemberCode(profile.memberCode)}
                </p>
              </div>
              {/* White plate under the symbol on purpose: a scanner needs the
                  contrast, and an amber or ink ground would not give it one. */}
              {everFlipped && (
                <span className="shrink-0 rounded-xl bg-white p-1.5">
                  <MemberQr size={72} />
                </span>
              )}
            </div>
            <p className="mt-5 text-[11px] font-semibold" style={{ color: cardInk(62) }}>
              Show this at the counter &middot; no expiry
            </p>
          </article>
        </div>
      </div>
      <button
        type="button"
        aria-pressed={flipped}
        onClick={() => {
          setEverFlipped(true);
          setFlipped((current) => !current);
        }}
        className="focus-ring mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
      >
        <RefreshCw size={13} aria-hidden="true" />
        {flipped ? `Show ${card.program} progress` : "Show my member code"}
      </button>
    </div>
  );
}

/** The customer's own code, rendered at whatever size the caller needs. */
function MemberQr({ size }: { size: number }) {
  const { data: profile } = useCustomerProfile();
  const memberCode = profile?.memberCode ?? "";
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    if (!memberCode) return;
    renderQrDataUrl(memberCode, size * 3)
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [memberCode, size]);

  if (!src) {
    return (
      <span
        className="block rounded bg-[var(--surface-2)] motion-safe:animate-pulse"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a generated data: URI
    <img src={src} alt={`Loyalty code ${formatMemberCode(memberCode)}`} width={size} height={size} />
  );
}

/**
 * What the customer has asked for under the Data Privacy Act, and the file
 * when one is ready.
 *
 * This used to be two booleans held in React state that said "you will be
 * notified when it is ready to download" - a sentence with nothing behind
 * it. The list survives a reload because it is the API's answer, and a
 * finished export is a real link.
 */
function DataRequests() {
  const { data: requests = [] } = useDataRequests();
  const [fetching, setFetching] = useState("");
  const [failed, setFailed] = useState("");
  const open = requests.filter((request) => request.status !== "completed");

  if (open.length === 0) return null;

  async function download(requestId: string) {
    setFetching(requestId);
    try {
      const { url } = await getDataExportLink(requestId);
      // A signed URL on the storage host, so the browser is sent to it
      // rather than the app trying to stream it through itself.
      window.location.assign(url);
    } catch (failure) {
      setFailed(
        failure instanceof ApiError
          ? failure.message
          : "That download could not be prepared.",
      );
    } finally {
      setFetching("");
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-[rgb(143_85_16/28%)] bg-[rgb(232_163_61/12%)] p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
        Your requests
      </p>
      <ul className="mt-2 space-y-2.5">
        {open.map((request) => (
          <li key={request.id} className="flex items-start gap-2 text-xs leading-relaxed">
            {request.kind === "deletion" ? (
              <Trash2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <Download size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              {request.kind === "deletion"
                ? "Account deletion is queued for identity review. You can still use your wallet until it completes."
                : request.status === "ready"
                  ? "Your export is ready."
                  // An email address is optional at sign-up - a wallet is a
                  // number and a code - so promising to write was a promise
                  // we could not keep for anyone who signed up with only a
                  // mobile. Everybody is told here; email is the extra.
                  : "Your export is being prepared. It is usually ready within "
                    + "ten minutes, and we will let you know here."}
              <span className="mt-0.5 block text-[10px] text-[var(--muted-strong)]">
                Asked for {relativeTime(request.requestedAt)}
              </span>
              {request.kind !== "deletion" && request.status === "ready" && (
                <button
                  type="button"
                  disabled={fetching === request.id}
                  onClick={() => download(request.id)}
                  className="mt-2 min-h-10 rounded-xl bg-[var(--ink)] px-4 text-xs font-extrabold text-[var(--paper)] disabled:opacity-60"
                >
                  {fetching === request.id ? "Preparing\u2026" : "Download it"}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {failed && (
        <p aria-live="polite" className="mt-3 text-xs font-bold text-[var(--danger)]">
          {failed}
        </p>
      )}
    </section>
  );
}

function HomeView({
  onWallet,
  onDiscover,
  onActivity,
  onApprove,
}: {
  onWallet: () => void;
  onDiscover: () => void;
  onActivity: () => void;
  onApprove: () => void;
}) {
  const { profile, claimSettling, wallet: cards, walletQuery } = useCustomerState();
  const walletPending = walletQuery.isPending;
  const where = useCoordinates(true);
  const { data: discover = [] } = useDiscover(where);
  const { data: approvals = [] } = usePendingApprovals();
  const { data: nudges = [] } = useNearby(where);
  // "Fresh from your places" showed a hardcoded Sweet Crumbs promotion - the
  // same afternoon batch, 18 minutes ago, to every customer of every shop,
  // including customers who had never heard of Sweet Crumbs. This is the
  // feed the section is named after; the newest entry is what is fresh.
  const { data: activity = [] } = useActivity();
  const latest = activity[0];

  // Two places the customer has not joined. The API returns discover
  // nearest-first when it is given a position, which is why it is given one.
  const suggestions = discover.filter((place) => !place.joined).slice(0, 2);

  // The card they are furthest along on. The badge used to read a number out
  // of the demo fixture, so every customer saw the same streak.
  // Only cards with something to reach, ranked by how close they are. Raw
  // progress was fine while a shop showed one stamp card; now that a points
  // balance sits beside it, 340 points would outrank seven stamps of eight
  // and "closest reward" would name the card furthest from paying out.
  // A held reward outranks any progress: that card has something waiting.
  const best = cards.reduce<(typeof cards)[number] | undefined>((leader, card) => {
    if (leader && leader.rewardsAvailable > 0 && card.rewardsAvailable === 0) return leader;
    if (card.rewardsAvailable > 0 && (!leader || leader.rewardsAvailable === 0)) return card;
    const share = percentOf(card);
    if (share === null) return leader;
    const leading = leader ? percentOf(leader) : null;
    return leading === null || share > leading ? card : leader;
  }, undefined);
  const held = cards.reduce((sum, card) => sum + card.rewardsAvailable, 0);

  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>
            {todayLabel()}
          </Eyebrow>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-strong)]">{greeting()},</p>
          {/* A lone "." until the profile answers. The placeholder profile
              is deliberately blank rather than undefined, which every other
              screen renders as empty space - but here it left the greeting
              reading "Good afternoon, ." for a frame. */}
          {profile.name ? (
            <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
              {profile.name.split(" ")[0]}.
            </h1>
          ) : (
            <Skeleton className="mt-1 h-8 w-32 rounded-lg" />
          )}
        </div>
        {best && best.progress > 0 && (
          <span className="mb-1 flex items-center gap-2 rounded-full bg-[rgb(15_118_85/12%)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--success)]">
            <Sparkles size={13} /> {best.progress}-stamp streak
          </span>
        )}
      </div>

      {/* A reward the counter is holding for this customer's tap. */}
      {approvals.length > 0 && (
        <section className="mt-7 rounded-3xl border border-[var(--ink)] bg-[var(--ink)] p-5 text-[var(--paper)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
                Waiting for your approval
              </p>
              <p className="mt-2 text-base font-extrabold tracking-[-0.02em]">
                {approvals.length === 1
                  ? `${approvals[0].reward} at ${approvals[0].business}`
                  : `${approvals.length} rewards at the counter`}
              </p>
              <p className="mt-1 text-xs text-white/60">Your approval releases the reward at the counter.</p>
            </div>
            {isPreview(approvals) && <PreviewBadge className="shrink-0" />}
          </div>
          <button
            type="button"
            onClick={onApprove}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-extrabold text-[var(--ink)]"
          >
            <BadgeCheck size={16} aria-hidden="true" /> Approve
          </button>
        </section>
      )}

      {/* Only when they are actually standing near one, and only if they
          switched the location toggle on - the API returns an empty list
          otherwise rather than guessing. */}
      {nudges.length > 0 && (
        <section className="mt-7 rounded-3xl border border-[var(--accent-strong)] bg-[var(--accent)] p-5">
          <Eyebrow>You are close by</Eyebrow>
          <ul className="mt-3 space-y-3">
            {nudges.slice(0, 2).map((nudge) => (
              <li key={nudge.branchId}>
                <p className="text-base font-extrabold tracking-[-0.02em]">
                  {nudge.business}
                </p>
                <p className="mt-0.5 text-xs font-semibold">
                  {nudge.branch} · {formatDistance(nudge.metres)} ·{" "}
                  {nudge.open ? "open now" : "closed"}
                </p>
                {nudge.reward && (
                  <p className="mt-1 text-xs font-bold">{nudge.reward} waiting</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-[-0.025em]">
            Closest reward
          </h2>
          <button
            onClick={onWallet}
            className="text-xs font-bold text-[var(--accent-strong)]"
          >
            My wallet
          </button>
        </div>
        {/* Loading is not the same as empty. Somebody who has just scanned a
            poster and finished signing up lands here while the wallet is still
            in flight, and for about a second the screen told them they had no
            cards - the one thing that reads as "the scan did not work" to a
            person holding a phone at a counter with a queue behind them. */}
        {/* ...and the wallet resolving *empty* is not the same as empty
            either. The claim from the poster settles a moment after the
            wallet loads, so the pending branch below missed the case it was
            written for: the query had finished, with nothing in it yet. */}
        {walletPending || (claimSettling && !best) ? (
          <Skeleton className="h-[168px] rounded-2xl" />
        ) : walletQuery.error ? (
          <QueryBoundary isPending={false} error={walletQuery.error} onRetry={walletQuery.refetch} label="your cards">
            {null}
          </QueryBoundary>
        ) : best ? (
          <LoyaltyCard card={best} />
        ) : (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted-strong)]">
            No cards yet. Scan a counter code to start one.
          </p>
        )}
        {!walletPending && cards.length > 0 && (
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Cards", String(cards.length)],
              ["Held rewards", String(held)],
              ["To approve", String(approvals.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-2 py-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</dt>
                <dd className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-[-0.025em]">
            Worth a short walk
          </h2>
          <button
            onClick={onDiscover}
            className="text-xs font-bold text-[var(--accent-strong)]"
          >
            Explore
          </button>
        </div>
        {/* These two cards were hardcoded - "Sage & Steam · 1.2 km" and
            "Rooted · 1.7 km" - so the home screen recommended two places that
            did not exist and never changed. They are the nearest businesses
            the customer has not joined. */}
        {/* An empty suggestion list means one of two opposite things, and this
            asserted the flattering one. A brand-new account with no
            memberships was told it had joined everything nearby, while the
            list was still loading. */}
        {suggestions.length === 0 ? (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[11px] text-[var(--muted)]">
            {discover.length === 0
              ? "Looking for places near you…"
              : "You have joined everything nearby. Explore to find more."}
          </p>
        ) : (
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
            {suggestions.map((place, index) => {
              const featured = index === 1;
              return (
                <button
                  key={place.id}
                  onClick={onDiscover}
                  className={`group rounded-2xl p-4 text-left transition hover:-translate-y-0.5 ${
                    featured
                      ? "bg-[var(--accent)]"
                      : "border border-[var(--line)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid size-11 place-items-center rounded-2xl ${
                        featured
                          ? "bg-[var(--surface)]"
                          : "bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]"
                      }`}
                    >
                      {featured ? <Leaf /> : <Coffee />}
                    </span>
                    {featured ? null : (
                      <ArrowRight
                        size={16}
                        className="text-[var(--muted)] transition group-hover:translate-x-0.5"
                      />
                    )}
                  </div>
                  <p className="mt-8 text-sm font-extrabold">{place.name}</p>
                  <p
                    className={`mt-1 text-[11px] ${
                      featured ? "text-[var(--ink)]/80" : "text-[var(--muted)]"
                    }`}
                  >
                    {place.category}
                    {place.distanceMetres === null
                      ? ""
                      : ` · ${formatDistance(place.distanceMetres)}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold tracking-[-0.025em]">
            Fresh from your places
          </h2>
          <button
            type="button"
            onClick={onActivity}
            className="text-xs font-bold text-[var(--accent-strong)]"
          >
            View activity
          </button>
        </div>
        {latest ? (
          <article className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
              <Megaphone size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">{latest.action}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                {latest.detail}
              </p>
              <p className="mt-2 text-[10px] font-semibold text-[var(--muted)]">
                {latest.business} · {relativeTime(latest.occurredAt)}
              </p>
            </div>
          </article>
        ) : (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted-strong)]">
            Nothing yet. Stamps, rewards and notes from the shops you have
            joined show up here.
          </p>
        )}
      </section>
    </div>
  );
}

/** Chips come from the data, so a "Cafés" chip cannot fail to match a "Café"
 *  card the way the hand-written list did. Derived per render now that both
 *  lists arrive from a request. */
const walletCategoriesFrom = (cards: WalletCard[], places: DiscoverPlace[]) => {
  // Deduped on a folded key, not the raw string. Merchants type their own
  // category and the seeded places carry their own spellings, so the filter
  // row read "cafe, Cafe, Café, Bakery, Cafe or bakery" - five chips, three
  // of which were the same word. The first spelling seen is the one shown.
  const seen = new Map<string, string>();
  for (const label of [
    ...cards.map((card) => card.category),
    ...places.map((place) => place.category),
  ]) {
    const key = label
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLowerCase();
    if (key && !seen.has(key)) seen.set(key, label);
  }
  return ["All", ...seen.values()];
};


function WalletView({
  onCard,
  onBusiness,
  onGifts,
}: {
  onCard: (id: string, programId: string) => void;
  onBusiness: (id: string) => void;
  onGifts: () => void;
}) {
  const { data: discover = [] } = useDiscover();
  const { wallet, joinedIds, walletQuery } = useCustomerState();
  const walletCategories = walletCategoriesFrom(wallet, discover);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const term = query.trim().toLowerCase();
  const matches = (name: string, group: string) =>
    (category === "All" || category === group) &&
    name.toLowerCase().includes(term);

  // The four cards used to be hand-written JSX with their own hardcoded
  // balances, drifting from the card sheet that read the same records.
  const visibleCards = wallet.filter((card) => matches(card.business, card.category));
  // Businesses joined from Discover that do not already have a wallet card.
  const walletBusinessIds = new Set(wallet.map((card) => card.businessId));
  const newlyJoined = discover.filter(
    (place) =>
      joinedIds.includes(place.id) &&
      !walletBusinessIds.has(place.businessId) &&
      matches(place.name, place.category),
  );
  const visibleCount = visibleCards.length + newlyJoined.length;

  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your collection</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Wallet</h1>
      <p className="mt-2 text-sm text-[var(--muted-strong)]">
        Every shop you have joined, one private member code.
      </p>
      <button
        type="button"
        onClick={onGifts}
        className="mt-5 flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 text-left transition hover:border-[var(--line-strong)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--paper)]">
          <Gift size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">Gifts</span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
            Pasalubong sent and received, and a way to send one.
          </span>
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <label className="mt-6 flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4">
        <Search size={17} className="text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search loyalty cards"
          placeholder="Search your cards"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
        />
      </label>
      <div className="customer-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
        {walletCategories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${category === item ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--surface-2)] text-[var(--muted-strong)]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <QueryBoundary
          isPending={walletQuery.isPending}
          error={walletQuery.error}
          onRetry={walletQuery.refetch}
          label="your cards"
          rows={3}
        >
          {null}
        </QueryBoundary>
      </div>
      <div className="mt-5 space-y-3">
        {visibleCards.map((card, index) => {
          const Icon = walletIcons[card.kind] ?? WalletCards;
          const pct = percentOf(card);
          const isFeature = index === 0 && !query && category === "All";
          const stateLine = cardStateLine(card);
          return (
            <button
              // A shop running stamps beside points puts two cards here under
              // one membership id, so the key is the pair.
              key={`${card.id}:${card.programId}`}
              type="button"
              onClick={() => onCard(card.id, card.programId)}
              className="block w-full text-left transition active:scale-[0.99]"
            >
              {isFeature ? (
                <LoyaltyCard card={card} compact />
              ) : (
                <span className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-extrabold">
                        {card.business}
                      </span>
                      <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em]">
                        {card.kind}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-[var(--muted)]">
                      {card.program} · {card.state === "pending" ? `${earnedStamps(card)} of ${card.target} · 1 pending` : card.balance}
                    </span>
                    {stateLine && (
                      <span className="mt-1 block text-[11px] font-semibold text-[var(--muted-strong)]">
                        {stateLine}
                      </span>
                    )}
                    {card.rewardsAvailable > 0 && (
                      <span className="mt-1 block text-[11px] font-extrabold text-[var(--success)]">
                        {card.rewardsAvailable === 1 ? "1 reward held" : `${card.rewardsAvailable} rewards held`}
                        {card.redeemBy ? ` · redeem by ${longDate(card.redeemBy)}` : ""}
                      </span>
                    )}
                    {pct !== null && card.state !== "closed" && (
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <span
                          className="block h-full rounded-full bg-[var(--success)]"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    )}
                    {(card.badge || isPreview(card)) && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {card.badge && (
                          <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            KYP Stamping
                          </span>
                        )}
                        {isPreview(card) && <PreviewBadge />}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {newlyJoined.map((business) => (
        <button
          key={business.id}
          type="button"
          onClick={() => onBusiness(business.id)}
          className="mt-3 flex w-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:scale-[0.99]"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-extrabold">{business.name}</p>
              <span className="rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)]">
                Joined
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
              {business.reward}
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" aria-hidden="true" />
        </button>
      ))}
      {visibleCount === 0 && !walletQuery.isPending && !walletQuery.error && (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
          <Search className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-extrabold">
            {query ? "No wallet cards found." : "Nothing in your wallet yet."}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {query
              ? "Try a different name or card category."
              : "Scan a counter code or join a shop from Discover to start one."}
          </p>
        </div>
      )}
      <div className="mt-7 rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted-strong)]">
          <WalletCards />
        </span>
        <p className="mt-4 text-sm font-extrabold">
          One code, every shop.
        </p>
        <p className="mx-auto mt-1 max-w-[30ch] text-xs leading-relaxed text-[var(--muted)]">
          Join a shop from its counter poster or from Discover and its card
          lands here with the terms in plain language.
        </p>
      </div>
    </div>
  );
}

function DiscoverView({ onBusiness }: { onBusiness: (id: string) => void }) {
  const { data: profile } = useCustomerProfile();
  // Asked for, on the one screen that is entirely about proximity. This
  // called useDiscover() with no position, so every distanceMetres came back
  // null, the "nearby only" filter could never match anything, and the list
  // was headed "Near you" over results ordered by nothing of the kind.
  const where = useCoordinates(true);
  const discoverQuery = useDiscover(where);
  const discover = discoverQuery.data ?? [];
  const located = discover.some((business) => business.distanceMetres !== null);
  const { joinedIds } = useCustomerState();
  // Chips come from the places themselves, so every chip matches something.
  const walletCategories = walletCategoriesFrom([], discover);
  const neighborhoods = ["All", ...new Set(discover.map((place) => place.neighborhood).filter(Boolean))];
  const [category, setCategory] = useState("All");
  const [neighborhood, setNeighborhood] = useState("All");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [nearestFirst, setNearestFirst] = useState(false);
  const filtered = discover.filter(
    (business) =>
      (category === "All" || business.category === category) &&
      (neighborhood === "All" || business.neighborhood === neighborhood) &&
      (!nearbyOnly ||
        (business.distanceMetres !== null && business.distanceMetres <= NEARBY_METRES)) &&
      `${business.name} ${business.neighborhood}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  // The API's order puts featured shops first; it is kept unless the customer
  // asks for nearest first, and even then a place with no distance stays last.
  const visibleBusinesses = nearestFirst
    ? [...filtered].sort(
        (a, b) => (a.distanceMetres ?? Number.POSITIVE_INFINITY) - (b.distanceMetres ?? Number.POSITIVE_INFINITY),
      )
    : filtered;
  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Local rewards</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Discover</h1>
      <p className="mt-2 text-sm text-[var(--muted-strong)]">
        Good places, made easier to return to.
      </p>
      <div className="mt-6 flex gap-2">
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4">
          <Search size={17} className="text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search nearby businesses"
            placeholder="Name or neighborhood"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
        </label>
        <button
          type="button"
          aria-label="Discover filters"
          aria-expanded={filtersOpen}
          aria-controls="discover-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${filtersOpen || nearbyOnly || nearestFirst ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--surface)]"}`}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>
      {filtersOpen && (
        <div id="discover-filters" className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {(
            [
              ["Nearest first", located ? "Sort by distance instead of featured placement" : "Needs your location, which this device has not shared", nearestFirst, () => setNearestFirst((on) => !on)],
              ["Walking distance", located ? "Show places within 1.5 km" : "Needs your location, which this device has not shared", nearbyOnly, () => setNearbyOnly((on) => !on)],
            ] as const
          ).map(([label, detail, on, toggle]) => (
            <div key={label} className="flex items-center justify-between p-3">
              <div>
                <p className="text-xs font-extrabold">{label}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">{detail}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                // Without a position every distance is null, so switching this
                // on would empty or scramble the list and look broken.
                disabled={!located}
                onClick={toggle}
                className={`relative h-6 w-10 shrink-0 rounded-full disabled:opacity-45 ${on ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
              >
                <span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${on ? "left-5" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="customer-scroll mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Category">
        {walletCategories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--surface-2)] text-[var(--muted-strong)]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {neighborhoods.length > 2 && (
        <div className="customer-scroll mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Neighborhood">
          {neighborhoods.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={neighborhood === item}
              onClick={() => setNeighborhood(item)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${neighborhood === item ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)]"}`}
            >
              {item === "All" ? "Anywhere" : item}
            </button>
          ))}
        </div>
      )}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-base font-extrabold">
          {/* "Near you" is a claim about distance, and without a position
              there is no distance to claim. */}
          {located ? "Near you" : `In ${profile?.city ?? "your area"}`} ·{" "}
          {visibleBusinesses.length}
        </h2>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
          <MapPin size={12} /> {profile?.city ?? ""}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {visibleBusinesses.map((business, index) => {
          const Icon = categoryIcons[business.category] ?? Store;
          const joined = joinedIds.includes(business.id) || business.joined;
          return (
            <button
              type="button"
              onClick={() => onBusiness(business.id)}
              key={business.name}
              className={`group flex w-full items-center gap-4 rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 ${index === 0 ? "bg-[var(--accent)]" : "border border-[var(--line)] bg-[var(--surface)]"}`}
            >
              <span className="relative grid size-13 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--surface)]">
                {business.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a presigned URL that expires, or a host only the merchant knows
                  <img
                    src={business.image}
                    alt=""
                    loading="lazy"
                    width={52}
                    height={52}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : null}
                {/* Visible only when there is no photo behind it. It used to
                    be opacity-0 always, which reserved the space and left a
                    shop with no storefront image showing a blank white box. */}
                <Icon
                  size={22}
                  className={
                    business.image ? "opacity-0" : "text-[var(--muted-strong)]"
                  }
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block truncate text-sm font-extrabold">
                    {business.name}
                  </span>
                  {joined && (
                    <span className="rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[var(--success)]">
                      Joined
                    </span>
                  )}
                </span>
                <span
                  className={`mt-1 block text-[11px] ${index === 0 ? "text-[var(--ink)]/80" : "text-[var(--muted)]"}`}
                >
                  {business.category}
                  {business.distanceMetres === null
                    ? ""
                    : ` · ${formatDistance(business.distanceMetres)}`}
                </span>
              </span>
              <ChevronRight
                size={17}
                className="transition group-hover:translate-x-0.5"
              />
            </button>
          );
        })}
        {discoverQuery.isPending || discoverQuery.error ? (
          <QueryBoundary
            isPending={discoverQuery.isPending}
            error={discoverQuery.error}
            onRetry={() => void discoverQuery.refetch()}
            label="places near you"
          >
            {null}
          </QueryBoundary>
        ) : visibleBusinesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
            <Search className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 text-sm font-extrabold">
              No places match this search.
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Try another neighborhood, name, or category.
            </p>
          </div>
        ) : null}
      </div>
      {MARKETPLACE_URL && (
        <a
          href={`${MARKETPLACE_URL}/discover`}
          className="mt-7 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--line-strong)]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted-strong)]">
            <Compass aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">Browse all shops on KYP</span>
            <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
              Every shop with a live card, by category and neighborhood.
            </span>
          </span>
          <ExternalLink size={16} className="shrink-0 text-[var(--muted)]" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function ProfileView({
  onOpen,
  onGifts,
}: {
  onOpen: (title: string, screen: ProfileScreen) => void;
  onGifts: () => void;
}) {
  const { profile, wallet } = useCustomerState();
  // Memberships, not cards: a shop running stamps beside points is one shop.
  const realWallet = [...new Set(wallet.filter((card) => !isPreview(card)).map((card) => card.id))];
  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Profile</h1>
      <div className="mt-6 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-[var(--accent)] text-xl font-extrabold">
          {profile.initials}
        </span>
        <div>
          <p className="text-base font-extrabold">{profile.name}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Member since {profile.memberSince ? longDate(profile.memberSince) : "…"}
          </p>
        </div>
      </div>
      <section className="mt-7 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {[
          {
            label: "Personal information",
            detail: "Name, birthday, mobile",
            icon: UserRound,
            screen: "personal" as ProfileScreen,
          },
          {
            label: "Notifications",
            detail: "Rewards and local offers",
            icon: Bell,
            screen: "notifications" as ProfileScreen,
          },
          {
            label: "Privacy center",
            detail: "Control what businesses see",
            icon: LockKeyhole,
            screen: "privacy" as ProfileScreen,
          },
          {
            label: "Gifts",
            detail: "Pasalubong sent and received",
            icon: Gift,
            screen: null,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              onClick={() => (item.screen ? onOpen(item.label, item.screen) : onGifts())}
              key={item.label}
              className={`flex w-full items-center gap-3 p-4 text-left ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-2)]">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                  {item.detail}
                </span>
              </span>
              <ChevronRight size={16} />
            </button>
          );
        })}
      </section>
      <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgb(15_118_85/12%)] text-[var(--success)]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold">Your data stays yours.</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              KYP does not sell customer data. Shops only see the details you
              choose to share.
            </p>
          </div>
        </div>
      </section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-4">
          <Eyebrow>Data and rights</Eyebrow>
          <p className="mt-1 text-sm font-extrabold">You stay in control</p>
        </div>
        {[
          {
            label: "Joined businesses",
            detail: `${realWallet.length} business${realWallet.length === 1 ? "" : "es"} can see your shared profile`,
            icon: Building2,
            screen: "businesses" as ProfileScreen,
          },
          {
            label: "Consent history",
            detail: "Review every permission and change",
            icon: History,
            screen: "consent" as ProfileScreen,
          },
          {
            label: "Download my data",
            detail: "Request a portable copy",
            icon: Download,
            screen: "export" as ProfileScreen,
          },
          {
            label: "Leave or delete",
            detail: "Exit a program or request account deletion",
            icon: Trash2,
            screen: "danger" as ProfileScreen,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              onClick={() => onOpen(item.label, item.screen)}
              key={item.label}
              className={`flex w-full items-center gap-3 p-4 text-left ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-2)]">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                  {item.detail}
                </span>
              </span>
              <ChevronRight size={16} />
            </button>
          );
        })}
      </section>
      <DataRequests />
      <nav aria-label="Legal" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold text-[var(--muted-strong)]">
        {SITE_URL && (
          <>
            <a href={`${SITE_URL}/privacy`} className="underline-offset-2 hover:underline">
              Privacy
            </a>
            <a href={`${SITE_URL}/terms`} className="underline-offset-2 hover:underline">
              Terms
            </a>
          </>
        )}
        {MARKETPLACE_URL && (
          <a href={`${MARKETPLACE_URL}/for-shops`} className="underline-offset-2 hover:underline">
            I run a shop
          </a>
        )}
      </nav>
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[rgb(178_59_43/28%)] bg-[rgb(178_59_43/6%)] text-sm font-extrabold text-[var(--danger)] active:scale-[0.98]"
      >
        <LogOut size={16} /> Sign out of this device
      </button>
    </div>
  );
}

function QrModal({
  close,
  notify,
}: {
  close: () => void;
  notify: (message: string, tone?: "success" | "error") => void;
}) {
  const { data: profile } = useCustomerProfile();
  const memberCode = profile?.memberCode ?? "";
  const closeRef = useRef<HTMLButtonElement>(null);
  // The screen is the card while this is open.
  useScreenAwake();

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className="qr-screen absolute inset-0 z-50 bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-title"
    >
      <header className="flex h-17 items-center justify-between border-b border-[var(--line)] px-5 pt-[env(safe-area-inset-top)]">
        <button
          ref={closeRef}
          onClick={close}
          aria-label="Close QR code"
          className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
        >
          <ArrowLeft size={18} />
        </button>
        <BrandMark label="KYP" tagline={null} compact />
        <button
          onClick={close}
          aria-label="Close"
          className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
        >
          <X size={18} />
        </button>
      </header>
      <div className="flex min-h-[calc(100%-68px)] flex-col items-center justify-center px-6 py-10 text-center">
        <Eyebrow>Your member code</Eyebrow>
        <h2
          id="qr-title"
          className="mt-2 text-2xl font-extrabold tracking-[-0.02em]"
        >
          Show this at the counter
        </h2>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[var(--muted-strong)]">
          Staff scan this to add a stamp, and to hand over a reward once you have
          earned one.
        </p>
        <div className="qr-printable relative mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_rgb(24_18_12/12%)]">
          <QrImage />
          <span className="scan-pass absolute inset-x-4 top-8 h-px bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
        </div>
        <div className="qr-printable-code mt-4 w-full max-w-[280px] rounded-2xl border border-[var(--line)] bg-white px-3 pb-2 pt-3">
          <Barcode code={memberCode} height={52} />
          <p className="mt-2 text-center font-mono text-xs font-bold tracking-[0.08em]">
            {formatMemberCode(memberCode)}
          </p>
        </div>

        <div className="mt-6 grid w-full max-w-[34ch] grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void saveQrImage(memberCode).then((saved) =>
                notify(
                  saved
                    ? "Code saved to your device. It works with no signal."
                    : "This browser could not save the image. Try printing instead.",
                  saved ? "success" : "error",
                ),
              );
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-xs font-extrabold transition active:scale-[0.98]"
          >
            <Download size={15} aria-hidden="true" /> Save image
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-xs font-extrabold transition active:scale-[0.98]"
          >
            <Printer size={15} aria-hidden="true" /> Print
          </button>
        </div>

        <div className="mt-5 flex max-w-[34ch] items-start gap-2 rounded-2xl bg-[rgb(15_118_85/10%)] p-3 text-left text-xs leading-relaxed text-[var(--muted-strong)]">
          <WifiOff size={16} className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden="true" />{" "}
          Works without data. Save it to your photos, print it, or ask the shop
          for a printed KYP card with the same code.
        </div>
        <div className="mt-3 flex max-w-[34ch] items-start gap-2 text-left text-[11px] leading-relaxed text-[var(--muted)]">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> The code
          identifies your account only. It carries no contact details, and it
          cannot be used to spend money or change your account.
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[var(--muted)]">
          <Nfc size={15} aria-hidden="true" /> You can also tap at supported counters.
        </div>
      </div>
    </div>
  );
}

/** Campaigns are the promotional kind; everything else is a service message. */
const isPromotional = (kind: string) => /campaign|promo|offer/i.test(kind);

function NotificationSheet({ close, onApprove }: { close: () => void; onApprove: () => void }) {
  const notificationsQuery = useNotifications();
  const notifications = notificationsQuery.data ?? [];
  const { data: approvals = [] } = usePendingApprovals();
  const { notificationsRead: allRead, markNotificationsRead: onMarkRead } =
    useCustomerState();
  const groups = [
    { title: "Service updates", detail: "Rewards, visits and your account. Always on.", rows: notifications.filter((n) => !isPromotional(n.kind)) },
    { title: "Promotions", detail: "Offers from shops you allowed. Off by default.", rows: notifications.filter((n) => isPromotional(n.kind)) },
  ];
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
      <SheetHeader title="Notifications" close={close} />
      <div className="px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6">
        <Eyebrow>Your places</Eyebrow>
        <h2
          id="notifications-title"
          className="mt-2 text-3xl font-extrabold tracking-[-0.03em]"
        >
          Inbox
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-strong)]">
          Service updates and promotions are kept apart.
        </p>
        {approvals.length > 0 && (
          <button
            type="button"
            onClick={onApprove}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-[var(--ink)] p-4 text-left text-[var(--paper)]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)]">
              <BadgeCheck size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">
                {approvals.length === 1 ? "A reward is waiting for your approval" : `${approvals.length} rewards are waiting for your approval`}
              </span>
              <span className="mt-0.5 block text-[11px] text-white/60">Your approval releases the reward at the counter.</span>
            </span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
        <div className="mt-6">
          <QueryBoundary
            isPending={notificationsQuery.isPending}
            error={notificationsQuery.error}
            onRetry={() => void notificationsQuery.refetch()}
            label="your inbox"
          >
            {groups.map((group) => (
              <section key={group.title} className="mt-6 first:mt-0">
                <h3 className="text-base font-extrabold tracking-[-0.02em]">{group.title}</h3>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">{group.detail}</p>
                {group.rows.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-dashed border-[var(--line-strong)] p-4 text-xs text-[var(--muted)]">
                    Nothing here yet.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {group.rows.map((notification) => {
                      const isRead = allRead || notification.read;
                      return (
                        <article key={notification.id} className="grid grid-cols-[auto_1fr] gap-3 py-5">
                          <span
                            className={`mt-0.5 grid size-10 place-items-center rounded-2xl ${isRead ? "bg-[var(--surface-2)]" : "bg-[var(--accent)]"}`}
                          >
                            <Bell size={17} aria-hidden="true" />
                          </span>
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-extrabold">{notification.title}</p>
                              {!isRead && (
                                <span className="size-2 shrink-0 rounded-full bg-[var(--accent-strong)]" aria-label="Unread" />
                              )}
                            </div>
                            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                              {notification.business ? `${notification.business} · ` : ""}
                              {notification.kind}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">{notification.body}</p>
                            <p className="mt-2 text-[10px] text-[var(--muted)]">{relativeTime(notification.receivedAt)}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </QueryBoundary>
        </div>
        <button
          type="button"
          disabled={allRead || notifications.length === 0}
          onClick={onMarkRead}
          className="mt-6 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-3 text-sm font-bold disabled:opacity-60"
        >
          {allRead ? "Everything is read" : "Mark everything read"}
        </button>
      </div>
    </div>
  );
}

function ActivitySheet({ close }: { close: () => void }) {
  const activityQuery = useActivity();
  const activity = activityQuery.data ?? [];
  const [filter, setFilter] = useState<"All" | "Earned" | "Used">("All");
  const visibleActivity = activity.filter((activity) => {
    if (filter === "All") return true;
    if (filter === "Earned") return activity.value.startsWith("+");
    return !activity.value.startsWith("+");
  });

  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-title"
    >
      <SheetHeader title="Activity" close={close} />
      <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6">
        <Eyebrow>Your loyalty ledger</Eyebrow>
        <h2
          id="activity-title"
          className="mt-2 text-3xl font-extrabold tracking-[-0.03em]"
        >
          Every change, explained.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          Earns, redemptions, and membership use stay traceable across every
          business in your wallet.
        </p>
        <div className="mt-6 grid grid-cols-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
          {(["All", "Earned", "Used"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`min-h-10 rounded-lg text-xs font-extrabold ${
                filter === item
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted-strong)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <QueryBoundary
            isPending={activityQuery.isPending}
            error={activityQuery.error}
            onRetry={() => void activityQuery.refetch()}
            label="your activity"
          >
            {visibleActivity.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center text-xs text-[var(--muted)]">
                {filter === "All" ? "No activity yet. Your first stamp will appear here." : `Nothing ${filter.toLowerCase()} yet.`}
              </p>
            )}
          </QueryBoundary>
        </div>
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {visibleActivity.map((activity) => (
            <article key={activity.id} className="flex items-center gap-3 py-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
                <History size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{activity.action}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-strong)]">
                  {activity.business} · {relativeTime(activity.occurredAt)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {activity.detail}
                </p>
                <code className="mt-2 block text-[9px] font-bold text-[var(--muted-strong)]">
                  {activity.reference}
                </code>
              </div>
              <strong
                className={`text-xs ${
                  activity.value.startsWith("+")
                    ? "text-[var(--success)]"
                    : "text-[var(--ink)]"
                }`}
              >
                {activity.value}
              </strong>
            </article>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[rgb(15_118_85/9%)] p-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[var(--success)]"
          />
          <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
            Businesses cannot rewrite history. Refunds, reversals, and
            adjustments appear as new entries so your balance always has a clear reason.
          </p>
        </div>
      </div>
    </div>
  );
}

function BusinessSheet({
  id,
  close,
  onJoin,
}: {
  id: string;
  close: () => void;
  onJoin: () => void;
}) {
  const { data: discover = [] } = useDiscover();
  const { joinedIds } = useCustomerState();
  const business =
    discover.find((item) => item.id === id) ??
    discover[0];
  const joined = joinedIds.includes(business.id);
  const Icon = categoryIcons[business.category] ?? Store;
  const [consentOpen, setConsentOpen] = useState(false);
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-title"
    >
      <SheetHeader title="Program details" close={close} />
      <div className="pb-[max(3rem,env(safe-area-inset-bottom))]">
        <section className="bg-[var(--ink)] px-5 py-8 text-[var(--paper)]">
          <div className="flex items-start justify-between">
            <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-[var(--ink)]">
              <Icon size={24} />
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/70">
              {business.open ? "Open now" : "Closed"}
            </span>
          </div>
          <h2
            id="business-title"
            className="mt-8 text-3xl font-extrabold tracking-[-0.03em]"
          >
            {business.name}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {business.category} · {business.neighborhood}
            {business.distanceMetres === null
              ? ""
              : ` · ${formatDistance(business.distanceMetres)}`}
          </p>
          {/* No photo, no frame. An empty bordered band reads as an image
              that failed to load rather than a shop that has not added one. */}
          {business.image && (
            <div className="mt-6 h-40 overflow-hidden rounded-2xl border border-white/12">
              {/* eslint-disable-next-line @next/next/no-img-element -- a presigned URL that expires, or a host only the merchant knows */}
              <img
                src={business.image}
                alt={`Inside ${business.name}`}
                width={800}
                height={533}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
              Program
            </p>
            <p className="mt-2 text-xl font-extrabold">{business.reward}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Earn after an eligible purchase. Staff confirms every earn and
              redemption event.
            </p>
          </div>
        </section>
        <div className="px-5 pt-6">
          <section className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Address
                </p>
                <p className="mt-1 text-sm font-extrabold leading-snug">
                  {business.address}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 border-t border-[var(--line)] pt-4">
              <Clock size={17} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div className="w-full">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Opening hours
                </p>
                <dl className="mt-1 space-y-1">
                  {business.hours.map((slot) => (
                    <div
                      key={slot.days}
                      className="flex items-baseline justify-between gap-4 text-sm"
                    >
                      <dt className="text-[var(--muted-strong)]">{slot.days}</dt>
                      <dd className="font-extrabold">{slot.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["One private QR", "Works across places you join"],
              ["Clear terms", "See earning, expiry, and value"],
              ["Your permissions", "Choose each contact channel"],
              ["Full history", "Review earns and redemptions"],
            ].map(([title, detail]) => (
              <article
                key={title}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
              >
                <Check size={16} className="text-[var(--success)]" />
                <p className="mt-5 text-sm font-extrabold">{title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {detail}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[rgb(15_118_85/9%)] p-4">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[var(--success)]"
            />
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              Joining shares your loyalty ID and chosen profile fields with{" "}
              {business.name}. Promotional permissions stay off until you turn
              them on.
            </p>
          </div>
          <button
            type="button"
            disabled={joined}
            onClick={() => setConsentOpen(true)}
            className={`mt-5 min-h-12 w-full rounded-xl text-sm font-extrabold ${joined ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]" : "bg-[var(--ink)] text-[var(--paper)]"}`}
          >
            {joined ? "Already in your wallet" : `Join ${business.name}`}
          </button>
        </div>
      </div>
      {consentOpen && (
        <JoinConsentDialog
          businessName={business.name}
          onCancel={() => setConsentOpen(false)}
          onConfirm={() => {
            setConsentOpen(false);
            onJoin();
          }}
        />
      )}
    </div>
  );
}

function JoinConsentDialog({
  businessName,
  onCancel,
  onConfirm,
}: {
  businessName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Reads the edited profile, so what the customer just changed is what the
  // dialog says will be shared.
  const { profile } = useCustomerState();
  const shared = [
    { label: "Loyalty ID", value: profile.id, icon: QrCode },
    { label: "Name", value: profile.name, icon: UserRound },
    { label: "Mobile number", value: profile.mobile, icon: Phone },
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Birthday", value: profile.birthday, icon: CakeSlice },
  ];
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="join-consent-title"
    >
      <button
        type="button"
        aria-label="Cancel joining"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[rgb(20_16_13/55%)] backdrop-blur-sm"
      />
      <section className="relative w-full rounded-t-[18px] bg-[var(--surface)] p-5 pb-8 sm:max-w-md sm:rounded-[var(--radius-card)] sm:pb-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
          Before you join
        </p>
        <h3 id="join-consent-title" className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
          Share your profile with {businessName}?
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
          Joining shares the details below so {businessName} can run your
          rewards. Promotional messages stay off until you turn them on.
        </p>
        <ul className="mt-4 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
          {shared.map(({ label, value, icon: ItemIcon }) => (
            <li key={label} className="flex items-center gap-3 px-4 py-3">
              <ItemIcon size={15} className="shrink-0 text-[var(--muted)]" />
              <span className="w-28 shrink-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
                {label}
              </span>
              <span className="truncate text-xs font-bold">{value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-[rgb(15_118_85/9%)] p-3.5">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
          <p className="text-[11px] leading-relaxed text-[var(--muted-strong)]">
            You can leave the program and revoke access anytime from your
            profile. KYP never sells your data.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] text-sm font-extrabold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)]"
          >
            Share &amp; join
          </button>
        </div>
      </section>
    </div>
  );
}

function WalletSheet({
  id,
  programId,
  close,
  onShowQr,
}: {
  id: string;
  programId: string;
  close: () => void;
  onShowQr: () => void;
}) {
  const { data: activity = [] } = useActivity();
  const { wallet } = useCustomerState();
  // By the pair. Matching on the membership alone returned whichever card of
  // that shop came first, so tapping Points opened the stamp card.
  const card = wallet.find(
    (item) => item.id === id && item.programId === programId,
  );
  // Leaving the shop while its sheet is open empties the wallet under it.
  if (!card) return null;
  const progress = percentOf(card);
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-card-title"
    >
      <SheetHeader title="Wallet card" close={close} />
      <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6">
        <section className="loyalty-ticket rounded-2xl p-6 text-[var(--paper)]">
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <WalletCards size={20} />
            </span>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/70">
              {card.kind}
            </span>
          </div>
          <h2
            id="wallet-card-title"
            className="mt-8 text-2xl font-extrabold tracking-[-0.02em]"
          >
            {card.business}
          </h2>
          <p className="mt-1 text-[11px] text-white/45">{card.program}</p>
          <p className="mt-2 text-sm text-white/60">
            {card.state === "pending" ? `${earnedStamps(card)} of ${card.target} · 1 pending` : card.balance}
          </p>
          {progress !== null && (
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="mt-3 flex justify-between text-[10px]">
            {/* A running balance has no percentage to report. */}
            <span className="text-white/55">
              {progress === null ? "Running balance" : `${progress}% progress`}
            </span>
            <strong className="text-[var(--accent)]">{card.reward}</strong>
          </div>
          <div style={{ "--card-ink": "var(--paper)" } as CSSProperties}>
            <CardStatus card={card} onCard />
          </div>
        </section>
        {card.rewardsAvailable > 0 && (
          <section className="mt-4 rounded-2xl border border-[rgb(15_118_85/28%)] bg-[rgb(15_118_85/9%)] p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--success)]">
              Held for you
            </p>
            <p className="mt-2 text-sm font-extrabold">
              {card.rewardsAvailable === 1 ? `1 ${card.reward}` : `${card.rewardsAvailable} × ${card.reward}`}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              Show your code at the counter. Staff reserve it, you approve it here, and it is handed over.
              {card.redeemBy ? ` Redeem by ${longDate(card.redeemBy)}.` : ""}
            </p>
          </section>
        )}
        <StoreCreditLine card={card} />
        <MissionList card={card} />
        <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {activity.filter(
            (activity) => activity.business === card.business,
          ).length === 0 && (
            <p className="p-4 text-xs text-[var(--muted)]">
              No activity recorded yet. Your first visit will appear here.
            </p>
          )}
          {activity
            .filter((activity) => activity.business === card.business)
            .map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 border-b border-[var(--line)] p-4 last:border-0"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-2)]">
                  <History size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{activity.action}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {activity.detail} · {relativeTime(activity.occurredAt)}
                  </p>
                </div>
                <span className="text-xs font-extrabold">{activity.value}</span>
              </div>
            ))}
        </section>
        <CardTerms card={card} />
        <PromoCodeEntry card={card} />
        <button
          type="button"
          onClick={onShowQr}
          className="mt-5 w-full rounded-full bg-[var(--ink)] py-3 text-sm font-extrabold text-[var(--paper)]"
        >
          Show my code for this place
        </button>
      </div>
    </div>
  );
}

function ProfileSheet({
  title,
  screen,
  close,
  notify,
}: {
  title: string;
  screen: ProfileScreen;
  close: () => void;
  notify: (message: string, tone?: "success" | "error") => void;
}) {
  const consentQuery = useConsentHistory();
  const consentHistory = consentQuery.data ?? [];
  const {
    profile,
    updateProfile,
    profileSave,
    channels,
    toggleChannel,
    wallet,
    leaveBusiness,
    deletionRequested,
    requestDeletion,
    exportRequested,
    requestExport,
  } = useCustomerState();
  const isPersonal = screen === "personal";
  const isNotifications = screen === "notifications";
  const isDanger = screen === "danger";
  const [leaveOpen, setLeaveOpen] = useState(false);
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-sheet-title"
    >
      <SheetHeader title={title} close={close} />
      <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6">
        <Eyebrow>Your control</Eyebrow>
        <h2
          id="profile-sheet-title"
          className="mt-2 text-2xl font-extrabold tracking-[-0.02em]"
        >
          {title}
        </h2>
        {isPersonal ? (
          <div className="mt-6 space-y-4">
            {(
              [
                ["Name", "name", UserRound, "text"],
                ["Birthday", "birthday", CakeSlice, "text"],
                ["Email", "email", Mail, "email"],
                ["Mobile", "mobile", Phone, "tel"],
              ] as const
            ).map(([label, field, icon, type]) => {
              // Writes to the shared profile, so the header, the join-consent
              // dialog, and the privacy centre all show the change.
              const Icon = icon;
              return (
                <label
                  key={String(label)}
                  className="grid gap-2 text-xs font-bold"
                >
                  {label}
                  <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-normal focus-within:border-[var(--ink)]">
                    <Icon size={16} className="text-[var(--muted)]" />
                    <input
                      type={type}
                      // Birthday is null until they give one, and null flips
                      // a controlled input to uncontrolled mid-edit.
                      value={profile[field] ?? ""}
                      onChange={(event) =>
                        updateProfile({ [field]: event.target.value })
                      }
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                  </span>
                </label>
              );
            })}
            {/* Every edit is sent as it is typed; this line is the API's answer. */}
            <p
              role="status"
              aria-live="polite"
              className={`text-xs font-bold ${profileSave.error ? "text-[var(--danger)]" : "text-[var(--muted-strong)]"}`}
            >
              {profileSave.isPending
                ? "Saving…"
                : profileSave.error
                  ? profileSave.error.message
                  : profileSave.isSuccess
                    ? "Saved. Your details are updated across the wallet."
                    : "Changes save as you type."}
            </p>
          </div>
        ) : isNotifications ? (
          <div className="mt-6">
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              Service messages keep your balances and visits clear and are always
              on. Promotions are off until you turn each channel on, and each
              one can be turned off again without leaving a program.
            </p>
            {CHANNELS.filter((channel) => channel.locked).map((channel) => (
              <div key={channel.key} className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">Service</p>
                  <p className="mt-1 text-sm font-extrabold">{channel.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">{channel.detail} · always on</p>
                </div>
                <span className="rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--success)]">
                  On
                </span>
              </div>
            ))}
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">Promotional</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {CHANNELS.filter((channel) => !channel.locked).map((channel, index) => (
              <div
                key={channel.key}
                className={`flex items-start gap-3 p-4 ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{channel.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                    {channel.detail}
                    {channel.locked ? " · always on" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={channels[channel.key]}
                  aria-label={`Toggle ${channel.label}`}
                  onClick={() => {
                    const next = toggleChannel(channel.key);
                    notify(`${channel.label} ${next ? "turned on" : "turned off"}.`);
                  }}
                  className={`relative h-6 w-10 shrink-0 rounded-full ${channels[channel.key] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white transition-all ${channels[channel.key] ? "left-5" : "left-1"}`}
                  />
                </button>
              </div>
            ))}
          </div>
            <PushSection />
          </div>
        ) : isDanger ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-[rgb(178_59_43/30%)] bg-[rgb(178_59_43/8%)] p-5">
              <Trash2 className="text-[var(--danger)]" />
              <p className="mt-5 text-sm font-extrabold">
                Choose the smallest action that fits.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                You can leave one business without deleting the rest of your
                wallet, or request full account deletion after identity
                verification.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={leaveOpen}
              onClick={() => setLeaveOpen((open) => !open)}
              className="mt-4 min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] text-sm font-bold"
            >
              Choose a business to leave
            </button>
            {leaveOpen && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                {/* One row per shop: a shop running two programs is one membership. */}
                {wallet
                  .filter((card, index, all) => all.findIndex((other) => other.id === card.id) === index)
                  .map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isPreview(card)}
                    title={isPreview(card) ? PREVIEW_WRITE_REASON : undefined}
                    onClick={() => {
                      // Removes the card from the wallet, the joined-businesses
                      // list, and the count on the profile — not just this row.
                      leaveBusiness(card.id);
                      notify(`You left ${card.business}. The card is out of your wallet.`);
                    }}
                    className="flex min-h-12 w-full items-center justify-between gap-2 border-b border-[var(--line)] px-4 text-left text-xs font-bold last:border-0 disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{card.business}</span>
                      {isPreview(card) && <PreviewBadge />}
                    </span>
                    <span className="shrink-0">Leave</span>
                  </button>
                ))}
                {wallet.length === 0 && (
                  <p className="px-4 py-4 text-xs text-[var(--muted)]">
                    You have left every program.
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={deletionRequested}
              onClick={() => {
                if (
                  !window.confirm(
                    "Request deletion of your KYP account? Your stamps, points, and stored value at every business would be permanently removed once identity is verified.",
                  )
                ) {
                  return;
                }
                requestDeletion();
                notify("Account deletion request queued for identity review.");
              }}
              className="mt-2 min-h-12 w-full rounded-xl bg-[var(--danger)] text-sm font-extrabold text-white disabled:opacity-65"
            >
              {deletionRequested
                ? "Deletion request received"
                : "Request account deletion"}
            </button>
          </div>
        ) : screen === "consent" ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <History className="text-[var(--accent-strong)]" />
              <p className="mt-5 text-sm font-extrabold">Every change, in order</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                Each entry records what changed, which business it applied to,
                and when it took effect.
              </p>
            </div>
            <div className="mt-4">
              <QueryBoundary
                isPending={consentQuery.isPending}
                error={consentQuery.error}
                onRetry={() => void consentQuery.refetch()}
                label="your consent history"
              >
                {consentHistory.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center text-xs text-[var(--muted)]">
                    No changes recorded yet.
                  </p>
                )}
              </QueryBoundary>
            </div>
            <ol className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {consentHistory.map((entry) => (
                <li key={entry.id} className="flex gap-3 py-4">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{entry.change}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {entry.scope} · {relativeTime(entry.occurredAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : screen === "privacy" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <ShieldCheck className="text-[var(--success)]" />
              <p className="mt-5 text-sm font-extrabold">What businesses can see</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                Only the fields you approved when joining. A business never sees
                your activity at another business.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
              {[
                ["Loyalty ID", "Always shared", true],
                ["Name", "Shared with joined businesses", true],
                [
                  "Mobile number",
                  channels.promoSms
                    ? "Shared, and used for SMS promotions"
                    : "Shared for service messages only",
                  true,
                ],
                [
                  "Email",
                  channels.promoEmail
                    ? "Shared, and used for email promotions"
                    : "Shared for service messages only",
                  true,
                ],
                ["Birthday", "Optional, for birthday rewards", true],
                [
                  "Location",
                  channels.nearby
                    ? "Used for nearby reminders while that is on"
                    : "Never shared. Discovery matches by city only",
                  channels.nearby,
                ],
              ].map(([field, note, shared]) => (
                <div key={String(field)} className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${shared ? "bg-[rgb(15_118_85/14%)] text-[var(--success)]" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}
                  >
                    {shared ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{field}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">{note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-4 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              You can withdraw any permission from Consent history, or leave a
              program entirely from Leave or delete.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <ShieldCheck className="text-[var(--success)]" />
              <p className="mt-5 text-sm font-extrabold">
                {screen === "export"
                  ? "What a copy includes"
                  : "Businesses you have joined"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                {screen === "export"
                  ? "Your profile, joined businesses, consent history, stamp and reward activity, and message history, in a machine-readable file."
                  : "Each of these can see the fields you approved when you joined, and nothing else."}
              </p>
            </div>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {wallet
                .filter((card, index, all) => all.findIndex((other) => other.id === card.id) === index)
                .map((card) => {
                  // The card carries no per-shop consent flags yet, so what is
                  // shown is the account-wide preference, and it says so.
                  const promos = [
                    channels.promoPush ? "push" : "",
                    channels.promoEmail ? "email" : "",
                    channels.promoSms ? "SMS" : "",
                  ].filter(Boolean);
                  return (
                    <div key={card.id} className="flex items-center gap-3 py-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                        <Building2 size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">{card.business}</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted)]">
                          Member code and name shared for service messages.{" "}
                          {promos.length > 0
                            ? `Promotions by ${promos.join(", ")}, from your account setting; no consent is on file for this shop specifically.`
                            : "No promotional channel is on for your account, so this shop cannot send promotions."}
                        </p>
                      </div>
                      {isPreview(card) ? (
                        <PreviewBadge className="shrink-0" />
                      ) : (
                        <span className="shrink-0 rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--success)]">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              {wallet.length === 0 && (
                <p className="py-4 text-xs text-[var(--muted)]">You have not joined a shop yet.</p>
              )}
            </div>
            {screen === "export" && (
              <button
                type="button"
                disabled={exportRequested}
                onClick={() => {
                  requestExport();
                  notify("Portable data export is being prepared.");
                }}
                className="mt-5 min-h-12 w-full rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)] disabled:opacity-65"
              >
                {exportRequested ? "Export requested" : "Request portable export"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerApp() {
  return (
    <CustomerStateProvider>
      <CustomerWallet />
    </CustomerStateProvider>
  );
}

function CustomerWallet() {
  const [tab, setTab] = useState<Tab>("home");
  const [qrOpen, setQrOpen] = useState(false);
  const { toast, setToast, dismiss } = useToast(3000);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const { joinBusiness, notificationsRead, profile } = useCustomerState();
  const { data: approvals = [] } = usePendingApprovals();
  // Warm the QR codec and the rendered symbol while there is still a connection.
  usePrefetchQrCodec(profile.memberCode);
  const notify = (message: string, tone: "success" | "error" = "success") => {
    setToastTone(tone);
    setToast(message);
  };
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    const validTabs = new Set<Tab>(["home", "wallet", "discover", "profile"]);
    // Deep links a notification can carry: #approve opens the approval sheet.
    const sheets: Record<string, { tab: Tab; sheet: Sheet }> = {
      approve: { tab: "home", sheet: { kind: "approve" } },
      gifts: { tab: "wallet", sheet: { kind: "gifts" } },
      activity: { tab: "home", sheet: { kind: "activity" } },
      notifications: { tab: "home", sheet: { kind: "notifications" } },
    };
    function syncFromHash() {
      const next = window.location.hash.slice(1) as Tab;
      if (validTabs.has(next)) {
        setTab(next);
        setSheet(null);
      } else if (sheets[next]) {
        setTab(sheets[next].tab);
        setSheet(sheets[next].sheet);
      }
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  function navigate(next: Tab) {
    setTab(next);
    setSheet(null);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.pushState({ tab: next }, "", url);
  }

  const titles: Record<Tab, string> = {
    home: "Home",
    wallet: "Wallet",
    discover: "Discover",
    profile: "Profile",
  };
  const content = {
    home: (
      <HomeView
        onWallet={() => navigate("wallet")}
        onDiscover={() => navigate("discover")}
        onActivity={() => setSheet({ kind: "activity" })}
        onApprove={() => setSheet({ kind: "approve" })}
      />
    ),
    wallet: (
      <WalletView
        onCard={(id, programId) => setSheet({ kind: "wallet", id, programId })}
        onBusiness={(id) => setSheet({ kind: "business", id })}
        onGifts={() => setSheet({ kind: "gifts" })}
      />
    ),
    discover: (
      <DiscoverView onBusiness={(id) => setSheet({ kind: "business", id })} />
    ),
    profile: (
      <ProfileView
        onOpen={(title, screen) => setSheet({ kind: "profile", title, screen })}
        onGifts={() => setSheet({ kind: "gifts" })}
      />
    ),
  }[tab];

  const tabs = [
    { key: "home" as Tab, label: "Home", icon: Home },
    { key: "wallet" as Tab, label: "Wallet", icon: WalletCards },
    { key: "discover" as Tab, label: "Discover", icon: Compass },
    { key: "profile" as Tab, label: "Profile", icon: UserRound },
  ];

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--paper)] shadow-xl transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className="relative mx-auto min-h-[100dvh] max-w-[460px] overflow-hidden border-x border-[rgb(24_18_12/8%)] bg-[var(--paper)] phone-shell"
      >
      <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-[var(--line)] bg-[rgb(250_248_243/90%)] px-5 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <BrandMark label="KYP" tagline={null} compact />
        <span className="sr-only">{titles[tab]}</span>
        <div className="flex items-center gap-2">
          {approvals.length > 0 && (
            <button
              type="button"
              onClick={() => setSheet({ kind: "approve" })}
              aria-label={`${approvals.length} reward${approvals.length === 1 ? "" : "s"} waiting for your approval`}
              className="relative grid size-10 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)]"
            >
              <BadgeCheck size={18} aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--ink)] text-[10px] font-extrabold text-[var(--paper)]">
                {approvals.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setSheet({ kind: "notifications" })}
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
          >
            <Bell size={18} />
            {!notificationsRead && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        </div>
      </header>

      <div
        className="customer-scroll max-h-[calc(100dvh-68px)] min-h-[calc(100dvh-68px)] overflow-y-auto"
      >
        {content}
      </div>

      <button
        type="button"
        onClick={() => setQrOpen(true)}
        className="absolute bottom-[76px] left-1/2 z-40 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] shadow-[0_12px_30px_rgb(24_18_12/28%)] transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)]">
          <QrCode size={17} />
        </span>{" "}
        My QR
      </button>

      <nav
        className="absolute inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-4 border-t border-[var(--line)] bg-[rgb(255_254_251/94%)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label="Customer navigation"
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                navigate(item.key);
              }}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${active ? "text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {qrOpen && <QrModal close={() => setQrOpen(false)} notify={notify} />}
      {sheet?.kind === "notifications" && (
        <NotificationSheet close={() => setSheet(null)} onApprove={() => setSheet({ kind: "approve" })} />
      )}
      {sheet?.kind === "activity" && (
        <ActivitySheet close={() => setSheet(null)} />
      )}
      {sheet?.kind === "approve" && <ApproveSheet close={() => setSheet(null)} />}
      {sheet?.kind === "gifts" && <GiftsSheet close={() => setSheet(null)} />}
      {sheet?.kind === "wallet" && (
        <WalletSheet
          id={sheet.id}
          programId={sheet.programId}
          close={() => setSheet(null)}
          onShowQr={() => {
            setSheet(null);
            setQrOpen(true);
          }}
        />
      )}
      {sheet?.kind === "business" && (
        <BusinessSheet
          id={sheet.id}
          close={() => setSheet(null)}
          onJoin={() => {
            joinBusiness(sheet.id);
            setToast("Business added to your wallet.");
          }}
        />
      )}
      {sheet?.kind === "profile" && (
        <ProfileSheet
          title={sheet.title}
          screen={sheet.screen}
          close={() => setSheet(null)}
          notify={notify}
        />
      )}
      {toast && (
        <Toast message={toast} onDismiss={dismiss} placement="sheet" tone={toastTone} />
      )}
      </main>
    </>
  );
}
