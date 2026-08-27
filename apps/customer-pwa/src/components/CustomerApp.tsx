"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { demoData } from "@stampr/demo-data";
import { BrandMark, Eyebrow, StampDots } from "@stampr/ui";
import { signOutDemo } from "@stampr/ui/auth";
import { Toast, todayLabel, useToast } from "@stampr/ui/shell";
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
  Crown,
  Download,
  Dumbbell,
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
  | { kind: "business"; id: string }
  | { kind: "wallet"; id: string }
  | { kind: "profile"; title: string; screen: ProfileScreen }
  | null;

const customerDemo = demoData.customer;
const sharedScenario = demoData.sharedScenario;
const categoryIcons: Record<string, typeof Coffee> = {
  Bakery: Croissant,
  Café: Coffee,
  Wellness: Leaf,
  Fitness: Dumbbell,
  Retail: Gift,
  Grooming: UserRound,
};

const memberCode = `KYP-${customerDemo.profile.id.toUpperCase()}`;

// The saved or printed image is the offline fallback, so it has to be a real,
// scannable symbol. A hand-drawn bitmap is not — QR needs finder patterns and
// Reed-Solomon error correction, which is not worth hand-rolling.
async function renderQrDataUrl(size: number) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(memberCode, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#181210", light: "#ffffff" },
  });
}

async function saveQrImage() {
  try {
    const url = await renderQrDataUrl(720);
    const link = document.createElement("a");
    link.download = `kypstamping-${customerDemo.profile.id}.png`;
    link.href = url;
    link.click();
    return true;
  } catch {
    return false;
  }
}

function QrImage() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    renderQrDataUrl(560)
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!src) {
    return (
      <div
        className="size-[196px] rounded-lg bg-[var(--surface-2)] motion-safe:animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a generated data: URI, not an optimisable asset
    <img
      src={src}
      alt={`Loyalty code ${memberCode}`}
      width={196}
      height={196}
      className="size-[196px]"
    />
  );
}

function LoyaltyCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className="loyalty-ticket overflow-hidden rounded-2xl px-5 py-5 text-[var(--paper)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
            <Croissant size={22} />
          </span>
          <div>
            <p className="text-base font-extrabold tracking-[-0.025em]">
              {sharedScenario.business}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">
              Neighborhood bakery
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60">
          Regular
        </span>
      </div>
      {!compact && (
        <p className="mt-7 max-w-[19ch] text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">
          Three more visits, then pastry.
        </p>
      )}
      <div className={compact ? "mt-5" : "mt-7"}>
        <div className="overflow-x-auto pb-1">
          <StampDots filled={5} total={8} dark />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
          <span className="text-white/50">
            {sharedScenario.loyaltyEvent.after} stamps
          </span>
          <span className="text-[var(--accent)]">Free pastry</span>
        </div>
        {!compact && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/12 pt-3 text-[9px] font-bold text-white/50">
            <span>
              Last visit · {sharedScenario.branch} · {sharedScenario.loyaltyEvent.occurredAt}
            </span>
            <code className="shrink-0 text-white/70">
              {sharedScenario.loyaltyEvent.id}
            </code>
          </div>
        )}
      </div>
    </article>
  );
}

function HomeView({
  onWallet,
  onDiscover,
  onActivity,
}: {
  onWallet: () => void;
  onDiscover: () => void;
  onActivity: () => void;
}) {
  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>
            {todayLabel()}
          </Eyebrow>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-strong)]">Good morning,</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
            {sharedScenario.customer.split(" ")[0]}.
          </h1>
        </div>
        <span className="mb-1 flex items-center gap-2 rounded-full bg-[rgb(15_118_85/12%)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--success)]">
          <Sparkles size={13} /> 5-stamp streak
        </span>
      </div>

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
        <LoyaltyCard />
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
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
          <button
            onClick={onDiscover}
            className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
                <Coffee />
              </span>
              <ArrowRight
                size={16}
                className="text-[var(--muted)] transition group-hover:translate-x-0.5"
              />
            </div>
            <p className="mt-8 text-sm font-extrabold">Sage & Steam</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Café · 1.2 km
            </p>
          </button>
          <button
            onClick={onDiscover}
            className="group rounded-2xl bg-[var(--accent)] p-4 text-left transition hover:-translate-y-0.5"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface)]">
              <Leaf />
            </span>
            <p className="mt-8 text-sm font-extrabold">Rooted</p>
            <p className="mt-1 text-[11px] text-[var(--ink)]/80">
              Wellness · 1.7 km
            </p>
          </button>
        </div>
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
        <article className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
            <Megaphone size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">
              An afternoon batch just landed.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              Drop by Sweet Crumbs before 4 PM and your next stamp counts twice.
            </p>
            <p className="mt-2 text-[10px] font-semibold text-[var(--muted)]">
              18 minutes ago
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

function WalletView({
  onCard,
  joinedIds,
  onBusiness,
}: {
  onCard: (id: string) => void;
  joinedIds: string[];
  onBusiness: (id: string) => void;
}) {
  const [quickPassAdded, setQuickPassAdded] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const matchesCard = (name: string, group: string) =>
    (category === "All" || category === group) &&
    name.toLowerCase().includes(query.trim().toLowerCase());
  const showSweet = matchesCard("Sweet Crumbs Bakery", "Food");
  const showSage = matchesCard("Sage & Steam", "Cafés");
  const showRooted = matchesCard("Rooted Studio", "Wellness");
  const showCorner = matchesCard("Corner Thread", "Retail");
  // Businesses joined from Discover that do not already have a fixture card.
  const newlyJoined = customerDemo.discover.filter(
    (business) =>
      joinedIds.includes(business.id) &&
      !business.joined &&
      (category === "All" || category === business.category) &&
      business.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const visibleCount =
    [showSweet, showSage, showRooted, showCorner].filter(Boolean).length +
    newlyJoined.length;

  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your collection</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Wallet</h1>
      <p className="mt-2 text-sm text-[var(--muted-strong)]">
        Every joined business, one private loyalty ID.
      </p>
      <button
        type="button"
        onClick={() => setQuickPassAdded(true)}
        disabled={quickPassAdded}
        className={`mt-5 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${quickPassAdded ? "border-[rgb(15_118_85/28%)] bg-[rgb(15_118_85/9%)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"}`}
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-2xl ${quickPassAdded ? "bg-[var(--success)] text-white" : "bg-[var(--ink)] text-[var(--paper)]"}`}
        >
          {quickPassAdded ? <ShieldCheck size={18} /> : <Download size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">
            {quickPassAdded ? "Quick pass added" : "Add a quick wallet pass"}
          </span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
            {quickPassAdded
              ? "Wallet passes are not issued in this demo. Save or print your code instead."
              : "Use Apple Wallet or Google Wallet without losing the full PWA."}
          </span>
        </span>
        {!quickPassAdded && <ChevronRight size={16} />}
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
        {["All", "Cafés", "Food", "Wellness", "Retail"].map((item) => (
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
      <button
        type="button"
        onClick={() => onCard("wallet_1")}
        className={`${showSweet ? "mt-5 block" : "hidden"} w-full text-left transition active:scale-[0.99]`}
      >
        <LoyaltyCard compact />
      </button>
      <div className={`${showSage || showRooted ? "mt-3 grid" : "hidden"} grid-cols-2 gap-3`}>
        <button
          type="button"
          onClick={() => onCard("wallet_2")}
          className={`${showSage ? "block" : "hidden"} rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:scale-[0.98]`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-[rgb(15_118_85/12%)] text-[var(--success)]">
              <Coins size={18} />
            </span>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em]">
              Points
            </span>
          </div>
          <p className="mt-7 text-sm font-extrabold">Sage & Steam</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
            640 <span className="text-xs text-[var(--muted)]">pts</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full w-[64%] rounded-full bg-[var(--success)]" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
            360 to a signature drink
          </p>
        </button>
        <button
          type="button"
          onClick={() => onCard("wallet_3")}
          className={`${showRooted ? "block" : "hidden"} rounded-2xl bg-[var(--accent)] p-4 text-left transition active:scale-[0.98]`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface)]">
              <Crown size={18} />
            </span>
            <span className="rounded-full border border-[rgb(24_18_12/15%)] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em]">
              Member
            </span>
          </div>
          <p className="mt-7 text-sm font-extrabold">Rooted Studio</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
            3 <span className="text-xs text-[var(--ink)]/80">of 5</span>
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-[var(--ink)]/80">
            Monthly class visits left
          </p>
        </button>
      </div>
      <button
        type="button"
        onClick={() => onCard("wallet_4")}
        className={`${showCorner ? "mt-3 flex" : "hidden"} w-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:scale-[0.99]`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--accent)]">
          <Gift size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-extrabold">Corner Thread</p>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em]">
              Gift
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Stored balance · partial use allowed
          </p>
        </div>
        <p className="text-lg font-extrabold tracking-[-0.02em]">₱740</p>
      </button>
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
      {visibleCount === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
          <Search className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-extrabold">No wallet cards found.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Try a different name or card category.
          </p>
        </div>
      )}
      <div className="mt-7 rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted-strong)]">
          <WalletCards />
        </span>
        <p className="mt-4 text-sm font-extrabold">
          Stamps, points, passes, and more.
        </p>
        <p className="mx-auto mt-1 max-w-[30ch] text-xs leading-relaxed text-[var(--muted)]">
          Join coupons, discounts, multipasses, memberships, reward catalogs,
          and gift cards from Discover or a business code.
        </p>
      </div>
    </div>
  );
}

function DiscoverView({
  onBusiness,
  joinedIds,
}: {
  onBusiness: (id: string) => void;
  joinedIds: string[];
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const visibleBusinesses = customerDemo.discover.filter(
    (business) =>
      (category === "All" || business.category === category) &&
      (!nearbyOnly || Number.parseFloat(business.distance) <= 1.5) &&
      `${business.name} ${business.neighborhood}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
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
          className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${filtersOpen || nearbyOnly ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--surface)]"}`}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>
      {filtersOpen && (
        <div
          id="discover-filters"
          className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
        >
          <div>
            <p className="text-xs font-extrabold">Walking distance</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              Show places within 1.5 km
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={nearbyOnly}
            aria-label="Only show places within one and a half kilometers"
            onClick={() => setNearbyOnly((active) => !active)}
            className={`relative h-6 w-10 shrink-0 rounded-full ${nearbyOnly ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition-all ${nearbyOnly ? "left-5" : "left-1"}`}
            />
          </button>
        </div>
      )}
      <div className="customer-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
        {[
          "All",
          "Bakery",
          "Café",
          "Wellness",
          "Fitness",
          "Retail",
          "Grooming",
        ].map((item) => (
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
      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-base font-extrabold">
          Near you · {visibleBusinesses.length}
        </h2>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
          <MapPin size={12} /> {customerDemo.profile.city}
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
                <img
                  src={business.image}
                  alt=""
                  loading="lazy"
                  width={52}
                  height={52}
                  className="absolute inset-0 size-full object-cover"
                />
                <Icon size={22} className="opacity-0" />
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
                  {business.category} · {business.distance}
                </span>
              </span>
              <ChevronRight
                size={17}
                className="transition group-hover:translate-x-0.5"
              />
            </button>
          );
        })}
        {visibleBusinesses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
            <Search className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 text-sm font-extrabold">
              No places match this search.
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Try another neighborhood, name, or category.
            </p>
          </div>
        )}
      </div>
      <article className="mt-7 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(15_118_85/12%)] text-[var(--success)]">
          <Dumbbell />
        </span>
        <p className="mt-5 text-base font-extrabold">A new kind of regular</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
          Fitness and wellness programs are now appearing in Discover around
          your neighborhood.
        </p>
      </article>
    </div>
  );
}

function ProfileView({
  onOpen,
}: {
  onOpen: (title: string, screen: ProfileScreen) => void;
}) {
  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Profile</h1>
      <div className="mt-6 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-[var(--accent)] text-xl font-extrabold">
          {customerDemo.profile.initials}
        </span>
        <div>
          <p className="text-base font-extrabold">
            {customerDemo.profile.name}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Member since {customerDemo.profile.memberSince}
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
      <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgb(15_118_85/12%)] text-[var(--success)]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold">Your data stays yours.</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              KYPStamping is designed not to sell customer data. Businesses only see the details
              you choose to share.
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
            detail: `${customerDemo.wallet.length} businesses can see your shared profile`,
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
      <button
        type="button"
        onClick={() => signOutDemo("customer")}
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
  const closeRef = useRef<HTMLButtonElement>(null);

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
        <BrandMark compact />
        <button
          onClick={close}
          aria-label="Close"
          className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
        >
          <X size={18} />
        </button>
      </header>
      <div className="flex min-h-[calc(100%-68px)] flex-col items-center justify-center px-6 py-10 text-center">
        <Eyebrow>Personal loyalty ID</Eyebrow>
        <h2
          id="qr-title"
          className="mt-2 text-2xl font-extrabold tracking-[-0.02em]"
        >
          Show this at the counter
        </h2>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[var(--muted-strong)]">
          Staff scan this to add a stamp. Redeeming a reward asks you to approve it first.
        </p>
        <div className="qr-printable relative mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_rgb(24_18_12/12%)]">
          <QrImage />
          <span className="scan-pass absolute inset-x-4 top-8 h-px bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
        </div>
        <span className="qr-printable-code mt-5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-xs font-bold tracking-[0.08em]">
          {memberCode}
        </span>

        <div className="mt-6 grid w-full max-w-[34ch] grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void saveQrImage().then((saved) =>
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
          Works without data. Save it to your photos, print it, or ask your
          business for a printed KYPStamping card with the same code.
        </div>
        <div className="mt-3 flex max-w-[34ch] items-start gap-2 text-left text-[11px] leading-relaxed text-[var(--muted)]">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> The code
          identifies your account only. It carries no contact details, and rewards
          cannot be redeemed without your approval.
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[var(--muted)]">
          <Nfc size={15} aria-hidden="true" /> You can also tap at supported counters.
        </div>
      </div>
    </div>
  );
}

function SheetHeader({ title, close }: { title: string; close: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  return (
    <header className="sticky top-0 z-10 flex h-17 items-center justify-between border-b border-[var(--line)] bg-[rgb(250_248_243/94%)] px-5 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <button
        type="button"
        onClick={close}
        aria-label={`Close ${title}`}
        className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
      >
        <ArrowLeft size={18} />
      </button>
      <p className="text-sm font-extrabold">{title}</p>
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
      >
        <X size={18} />
      </button>
    </header>
  );
}

function NotificationSheet({
  close,
  allRead,
  onMarkRead,
}: {
  close: () => void;
  allRead: boolean;
  onMarkRead: () => void;
}) {

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
          Service updates, reward progress, and promotions stay clearly labeled.
        </p>
        <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {customerDemo.notifications.map((notification) => {
            const isRead = allRead || notification.read;
            return (
              <article
                key={notification.id}
                className="grid grid-cols-[auto_1fr] gap-3 py-5"
              >
                <span
                  className={`mt-0.5 grid size-10 place-items-center rounded-2xl ${isRead ? "bg-[var(--surface-2)]" : "bg-[var(--accent)]"}`}
                >
                  <Bell size={17} />
                </span>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold">
                      {notification.title}
                    </p>
                    {!isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-[var(--accent-strong)]" />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                    {notification.business} · {notification.kind}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-[10px] text-[var(--muted)]">
                    {notification.time}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <button
          type="button"
          disabled={allRead}
          onClick={onMarkRead}
          className="mt-6 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-3 text-sm font-bold"
        >
          {allRead ? "Everything is read" : "Mark everything read"}
        </button>
      </div>
    </div>
  );
}

function ActivitySheet({ close }: { close: () => void }) {
  const [filter, setFilter] = useState<"All" | "Earned" | "Used">("All");
  const visibleActivity = customerDemo.activity.filter((activity) => {
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
        <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {visibleActivity.map((activity) => (
            <article key={activity.id} className="flex items-center gap-3 py-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
                <History size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{activity.action}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-strong)]">
                  {activity.business} · {activity.date}
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
  joined,
  onJoin,
}: {
  id: string;
  close: () => void;
  joined: boolean;
  onJoin: () => void;
}) {
  const business =
    customerDemo.discover.find((item) => item.id === id) ??
    customerDemo.discover[0];
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
            {business.category} · {business.neighborhood} · {business.distance}
          </p>
          <div className="mt-6 h-40 overflow-hidden rounded-2xl border border-white/12">
            <img
              src={business.image}
              alt={`Inside ${business.name}`}
              width={800}
              height={533}
              className="size-full object-cover"
            />
          </div>
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
  const shared = [
    { label: "Loyalty ID", value: customerDemo.profile.id, icon: QrCode },
    { label: "Name", value: customerDemo.profile.name, icon: UserRound },
    { label: "Mobile number", value: customerDemo.profile.mobile, icon: Phone },
    { label: "Email", value: customerDemo.profile.email, icon: Mail },
    { label: "Birthday", value: customerDemo.profile.birthday, icon: CakeSlice },
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
            profile. KYPStamping never sells your data.
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
  close,
  onShowQr,
}: {
  id: string;
  close: () => void;
  onShowQr: () => void;
}) {
  const card =
    customerDemo.wallet.find((item) => item.id === id) ??
    customerDemo.wallet[0];
  const progress = Math.min(
    100,
    Math.round((card.progress / card.target) * 100),
  );
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
          <p className="mt-2 text-sm text-white/60">{card.balance}</p>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px]">
            <span className="text-white/55">{progress}% progress</span>
            <strong className="text-[var(--accent)]">{card.reward}</strong>
          </div>
        </section>
        <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {customerDemo.activity.filter(
            (activity) => activity.business === card.business,
          ).length === 0 && (
            <p className="p-4 text-xs text-[var(--muted)]">
              No activity recorded yet. Your first visit will appear here.
            </p>
          )}
          {customerDemo.activity
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
                    {activity.detail} · {activity.date}
                  </p>
                </div>
                <span className="text-xs font-extrabold">{activity.value}</span>
              </div>
            ))}
        </section>
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-sm font-extrabold">Program terms</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
            Only approved events change this balance. Rewards have no cash
            value, and any expiry or transfer rule must appear here before it
            applies.
          </p>
        </div>
        <button
          type="button"
          onClick={onShowQr}
          className="mt-5 w-full rounded-full bg-[var(--ink)] py-3 text-sm font-extrabold text-[var(--paper)]"
        >
          Show my QR for this place
        </button>
      </div>
    </div>
  );
}

type Personal = {
  name: string;
  birthday: string;
  email: string;
  mobile: string;
};

function ProfileSheet({
  title,
  screen,
  close,
  notify,
  channelSettings,
  setChannelSettings,
  personal,
  setPersonal,
  leftBusinesses,
  setLeftBusinesses,
  deletionRequested,
  setDeletionRequested,
  exportRequested,
  setExportRequested,
}: {
  title: string;
  screen: ProfileScreen;
  close: () => void;
  notify: (message: string, tone?: "success" | "error") => void;
  channelSettings: boolean[];
  setChannelSettings: Dispatch<SetStateAction<boolean[]>>;
  personal: Personal;
  setPersonal: Dispatch<SetStateAction<Personal>>;
  leftBusinesses: string[];
  setLeftBusinesses: Dispatch<SetStateAction<string[]>>;
  deletionRequested: boolean;
  setDeletionRequested: Dispatch<SetStateAction<boolean>>;
  exportRequested: boolean;
  setExportRequested: Dispatch<SetStateAction<boolean>>;
}) {
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
                      value={personal[field]}
                      onChange={(event) =>
                        setPersonal((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                  </span>
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => notify("Profile changes saved for this demo session.")}
              className="min-h-12 w-full rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)]"
            >
              Save changes
            </button>
          </div>
        ) : isNotifications ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {(
              [
                [
                  "Reward and service updates",
                  "Needed to keep balances and visits clear",
                ],
                ["Promotional push", "Offers from businesses you joined"],
                ["Email promotions", "Longer news and birthday offers"],
                ["SMS promotions", "Paid channel, used sparingly"],
                ["Nearby reminders", "Uses location only while enabled"],
              ] as const
            ).map(([label, detail], index) => (
              <div
                key={String(label)}
                className={`flex items-start gap-3 p-4 ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                    {detail}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={channelSettings[index]}
                  aria-label={`Toggle ${label}`}
                  onClick={() =>
                    setChannelSettings((current) =>
                      current.map((value, settingIndex) =>
                        settingIndex === index ? !value : value,
                      ),
                    )
                  }
                  className={`relative h-6 w-10 shrink-0 rounded-full ${channelSettings[index] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white transition-all ${channelSettings[index] ? "left-5" : "left-1"}`}
                  />
                </button>
              </div>
            ))}
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
                {customerDemo.wallet.map((card) => {
                  const left = leftBusinesses.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={left}
                      onClick={() => {
                        setLeftBusinesses((current) => [...current, card.id]);
                        notify(`You left ${card.business} in this demo.`);
                      }}
                      className="flex min-h-12 w-full items-center justify-between border-b border-[var(--line)] px-4 text-left text-xs font-bold last:border-0 disabled:text-[var(--muted)]"
                    >
                      {card.business}
                      <span>{left ? "Left" : "Leave"}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              disabled={deletionRequested}
              onClick={() => {
                if (
                  !window.confirm(
                    "Request deletion of your KYPStamping account? Your stamps, points, and stored value at every business would be permanently removed once identity is verified.",
                  )
                ) {
                  return;
                }
                setDeletionRequested(true);
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
            <ol className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[
                ["Joined Sweet Crumbs Bakery", "Shared loyalty ID, name, mobile", "12 Feb 2026"],
                ["Turned on promotional push", "All joined businesses", "12 Feb 2026"],
                ["Joined Sage & Steam", "Shared loyalty ID, name", "3 Mar 2026"],
                ["Turned off SMS promotions", "All joined businesses", "19 Jun 2026"],
                ["Added birthday", "Sweet Crumbs Bakery", "2 Aug 2026"],
              ].map(([change, scope, when]) => (
                <li key={change} className="flex gap-3 py-4">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{change}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {scope} · {when}
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
                ["Mobile number", "Shared with joined businesses", true],
                ["Email", "Shared when you opt in to email", true],
                ["Birthday", "Optional, for birthday rewards", true],
                ["Location", "Never shared. Discovery matches by city only", false],
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
              {customerDemo.wallet.map((card) => (
                <div key={card.id} className="flex items-center gap-3 py-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)]">
                    <Building2 size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{card.business}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      Loyalty ID + name · promotions optional
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--success)]">
                    Active
                  </span>
                </div>
              ))}
            </div>
            {screen === "export" && (
              <button
                type="button"
                disabled={exportRequested}
                onClick={() => {
                  setExportRequested(true);
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
  const [tab, setTab] = useState<Tab>("home");
  const [qrOpen, setQrOpen] = useState(false);
  const { toast, setToast, dismiss } = useToast(3000);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [channelSettings, setChannelSettings] = useState([
    true,
    true,
    true,
    false,
    false,
  ]);
  const [personal, setPersonal] = useState<Personal>({
    name: customerDemo.profile.name,
    birthday: customerDemo.profile.birthday,
    email: customerDemo.profile.email,
    mobile: customerDemo.profile.mobile,
  });
  const [leftBusinesses, setLeftBusinesses] = useState<string[]>([]);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);
  const notify = (message: string, tone: "success" | "error" = "success") => {
    setToastTone(tone);
    setToast(message);
  };
  const [sheet, setSheet] = useState<Sheet>(null);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [joinedIds, setJoinedIds] = useState(() =>
    customerDemo.discover
      .filter((business) => business.joined)
      .map((business) => business.id),
  );

  useEffect(() => {
    const validTabs = new Set<Tab>(["home", "wallet", "discover", "profile"]);
    function syncFromHash() {
      const next = window.location.hash.slice(1) as Tab;
      if (validTabs.has(next)) {
        setTab(next);
        setSheet(null);
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
      />
    ),
    wallet: (
      <WalletView
        onCard={(id) => setSheet({ kind: "wallet", id })}
        joinedIds={joinedIds}
        onBusiness={(id) => setSheet({ kind: "business", id })}
      />
    ),
    discover: (
      <DiscoverView
        joinedIds={joinedIds}
        onBusiness={(id) => setSheet({ kind: "business", id })}
      />
    ),
    profile: (
      <ProfileView
        onOpen={(title, screen) => setSheet({ kind: "profile", title, screen })}
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
        <BrandMark compact />
        <span className="sr-only">{titles[tab]}</span>
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
        <NotificationSheet
          close={() => setSheet(null)}
          allRead={notificationsRead}
          onMarkRead={() => setNotificationsRead(true)}
        />
      )}
      {sheet?.kind === "activity" && (
        <ActivitySheet close={() => setSheet(null)} />
      )}
      {sheet?.kind === "wallet" && (
        <WalletSheet
          id={sheet.id}
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
          joined={joinedIds.includes(sheet.id)}
          onJoin={() => {
            setJoinedIds((current) =>
              current.includes(sheet.id) ? current : [...current, sheet.id],
            );
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
          channelSettings={channelSettings}
          setChannelSettings={setChannelSettings}
          personal={personal}
          setPersonal={setPersonal}
          leftBusinesses={leftBusinesses}
          setLeftBusinesses={setLeftBusinesses}
          deletionRequested={deletionRequested}
          setDeletionRequested={setDeletionRequested}
          exportRequested={exportRequested}
          setExportRequested={setExportRequested}
        />
      )}
      {toast && (
        <Toast message={toast} onDismiss={dismiss} placement="sheet" tone={toastTone} />
      )}
      </main>
    </>
  );
}
