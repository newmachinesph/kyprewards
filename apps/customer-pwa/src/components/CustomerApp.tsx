"use client";

import { useEffect, useState } from "react";
import { demoData } from "@stampr/demo-data";
import { BrandMark, Eyebrow, StampDots } from "@stampr/ui";
import { signOutDemo } from "@stampr/ui/auth";
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
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

type Tab = "home" | "wallet" | "discover" | "profile";
type Sheet =
  | { kind: "notifications" }
  | { kind: "activity" }
  | { kind: "business"; id: string }
  | { kind: "wallet"; id: string }
  | { kind: "profile"; title: string }
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

const qrPattern = [
  "11111001011111",
  "10001011010001",
  "10101001110101",
  "10001010110001",
  "11111010111111",
  "00000011000000",
  "10111100101101",
  "01100111110010",
  "11011001011100",
  "00101110100111",
  "11111001110101",
  "10001011001110",
  "10101001111011",
  "10001010100100",
  "11111001101111",
];

function LoyaltyCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className="loyalty-ticket overflow-hidden rounded-[28px] px-5 py-5 text-[var(--paper)]">
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
        <p className="mt-7 max-w-[19ch] text-2xl font-black leading-[1.05] tracking-[-0.05em]">
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
      <Eyebrow>Tuesday, 25 August</Eyebrow>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-strong)]">Good morning,</p>
          <h1 className="text-3xl font-black tracking-[-0.055em]">
            {sharedScenario.customer.split(" ")[0]}.
          </h1>
        </div>
        <span className="mb-1 flex items-center gap-2 rounded-full bg-[rgb(32_169_120/12%)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--success)]">
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
            className="group rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(242_161_45/14%)] text-[var(--accent-strong)]">
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
            className="group rounded-[24px] bg-[var(--accent)] p-4 text-left transition hover:-translate-y-0.5"
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
        <article className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
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

function WalletView({ onCard }: { onCard: (id: string) => void }) {
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
  const visibleCount = [showSweet, showSage, showRooted, showCorner].filter(
    Boolean,
  ).length;

  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your collection</Eyebrow>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.055em]">Wallet</h1>
      <p className="mt-2 text-sm text-[var(--muted-strong)]">
        Every joined business, one private loyalty ID.
      </p>
      <button
        type="button"
        onClick={() => setQuickPassAdded(true)}
        disabled={quickPassAdded}
        className={`mt-5 flex w-full items-center gap-3 rounded-[20px] border p-3.5 text-left transition ${quickPassAdded ? "border-[rgb(32_169_120/28%)] bg-[rgb(32_169_120/9%)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"}`}
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
              ? "Your Stampr QR is ready from your phone wallet."
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
          className={`${showSage ? "block" : "hidden"} rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:scale-[0.98]`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-[rgb(32_169_120/12%)] text-[var(--success)]">
              <Coins size={18} />
            </span>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em]">
              Points
            </span>
          </div>
          <p className="mt-7 text-sm font-extrabold">Sage & Steam</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.05em]">
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
          className={`${showRooted ? "block" : "hidden"} rounded-[24px] bg-[var(--accent)] p-4 text-left transition active:scale-[0.98]`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface)]">
              <Crown size={18} />
            </span>
            <span className="rounded-full border border-[rgb(37_29_24/15%)] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em]">
              Member
            </span>
          </div>
          <p className="mt-7 text-sm font-extrabold">Rooted Studio</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.05em]">
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
        className={`${showCorner ? "mt-3 flex" : "hidden"} w-full items-center gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition active:scale-[0.99]`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--accent)]">
          <Gift size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-extrabold">Corner Thread</p>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em]">
              Gift
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Stored balance · partial use allowed
          </p>
        </div>
        <p className="text-lg font-black tracking-[-0.04em]">₱740</p>
      </button>
      {visibleCount === 0 && (
        <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line-strong)] p-7 text-center">
          <Search className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-extrabold">No wallet cards found.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Try a different name or card category.
          </p>
        </div>
      )}
      <div className="mt-7 rounded-[24px] border border-dashed border-[var(--line-strong)] p-6 text-center">
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
      <h1 className="mt-2 text-3xl font-black tracking-[-0.055em]">Discover</h1>
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
          <MapPin size={12} /> Pasig
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
              className={`group flex w-full items-center gap-4 rounded-[22px] p-3.5 text-left transition hover:-translate-y-0.5 ${index === 0 ? "bg-[var(--accent)]" : "border border-[var(--line)] bg-[var(--surface)]"}`}
            >
              <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-[var(--surface)]">
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block truncate text-sm font-extrabold">
                    {business.name}
                  </span>
                  {joined && (
                    <span className="rounded-full bg-[rgb(15_118_85/12%)] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-[var(--success)]">
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
          <div className="rounded-[22px] border border-dashed border-[var(--line-strong)] p-7 text-center">
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
      <article className="mt-7 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(32_169_120/12%)] text-[var(--success)]">
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

function ProfileView({ onOpen }: { onOpen: (title: string) => void }) {
  return (
    <div className="px-5 pb-32 pt-5">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.055em]">Profile</h1>
      <div className="mt-6 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-[22px] bg-[var(--accent)] text-xl font-black">
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
      <section className="mt-7 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
        {[
          {
            label: "Personal information",
            detail: "Name, birthday, mobile",
            icon: UserRound,
          },
          {
            label: "Notifications",
            detail: "Rewards and local offers",
            icon: Bell,
          },
          {
            label: "Privacy center",
            detail: "Control what businesses see",
            icon: LockKeyhole,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              onClick={() => onOpen(item.label)}
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
      <section className="mt-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgb(32_169_120/12%)] text-[var(--success)]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold">Your data stays yours.</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              Stampr never sells customer data. Businesses only see the details
              you choose to share.
            </p>
          </div>
        </div>
      </section>
      <section className="mt-4 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-4">
          <Eyebrow>Data and rights</Eyebrow>
          <p className="mt-1 text-sm font-extrabold">You stay in control</p>
        </div>
        {[
          {
            label: "Joined businesses",
            detail: "3 businesses can see your shared profile",
            icon: Building2,
          },
          {
            label: "Consent history",
            detail: "Review every permission and change",
            icon: History,
          },
          {
            label: "Download my data",
            detail: "Request a portable copy",
            icon: Download,
          },
          {
            label: "Leave or delete",
            detail: "Exit a program or request account deletion",
            icon: Trash2,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              onClick={() => onOpen(item.label)}
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
        onClick={() => onOpen("App settings")}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-3 text-sm font-bold"
      >
        <Settings2 size={16} /> App settings
      </button>
      <button
        type="button"
        onClick={() => signOutDemo("customer")}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[rgb(178_59_43/28%)] bg-[rgb(178_59_43/6%)] text-sm font-black text-[var(--danger)] active:scale-[0.98]"
      >
        <LogOut size={16} /> Sign out of this device
      </button>
    </div>
  );
}

function QrModal({ close }: { close: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-title"
    >
      <header className="flex h-17 items-center justify-between border-b border-[var(--line)] px-5">
        <button
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
          className="mt-2 text-2xl font-black tracking-[-0.045em]"
        >
          Show this at the counter
        </h2>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[var(--muted-strong)]">
          Staff can stamp or redeem after you approve the visit.
        </p>
        <div className="relative mt-8 overflow-hidden rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_rgb(37_29_24/12%)]">
          <div
            className="grid grid-cols-[repeat(14,12px)] gap-[2px]"
            aria-label="Demo QR code"
          >
            {qrPattern.flatMap((row, y) =>
              row
                .split("")
                .map((cell, x) => (
                  <span
                    key={`${x}-${y}`}
                    className={`aspect-square ${cell === "1" ? "bg-[var(--ink)]" : "bg-transparent"}`}
                  />
                )),
            )}
          </div>
          <span className="scan-pass absolute inset-x-4 top-8 h-px bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
        </div>
        <span className="mt-5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-xs font-bold tracking-[0.08em]">
          STAMPR-6A8C38
        </span>
        <div className="mt-7 flex max-w-[34ch] items-start gap-2 rounded-2xl bg-[rgb(32_169_120/10%)] p-3 text-left text-xs leading-relaxed text-[var(--muted-strong)]">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0 text-[var(--success)]"
          />{" "}
          Your rotating code identifies you securely. It does not contain your
          contact details.
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[var(--muted)]">
          <Nfc size={15} /> You can also tap at supported counters.
        </div>
      </div>
    </div>
  );
}

function SheetHeader({ title, close }: { title: string; close: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-17 items-center justify-between border-b border-[var(--line)] bg-[rgb(247_243_236/94%)] px-5 backdrop-blur-xl">
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

function NotificationSheet({ close }: { close: () => void }) {
  const [allRead, setAllRead] = useState(false);

  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
      <SheetHeader title="Notifications" close={close} />
      <div className="px-5 pb-10 pt-6">
        <Eyebrow>Your places</Eyebrow>
        <h2
          id="notifications-title"
          className="mt-2 text-3xl font-black tracking-[-0.055em]"
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
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent-strong)]">
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
          onClick={() => setAllRead(true)}
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
      <div className="px-5 pb-12 pt-6">
        <Eyebrow>Your loyalty ledger</Eyebrow>
        <h2
          id="activity-title"
          className="mt-2 text-3xl font-black tracking-[-0.055em]"
        >
          Every change, explained.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          Earns, redemptions, and membership use stay traceable across every
          business in your wallet.
        </p>
        <div className="mt-6 grid grid-cols-3 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
          {(["All", "Earned", "Used"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`min-h-10 rounded-full text-xs font-extrabold ${
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
        <div className="mt-5 flex items-start gap-3 rounded-[22px] bg-[rgb(15_118_85/9%)] p-4">
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
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-title"
    >
      <SheetHeader title="Program details" close={close} />
      <div className="pb-12">
        <section className="bg-[var(--ink)] px-5 py-8 text-[var(--paper)]">
          <div className="flex items-start justify-between">
            <span className="grid size-14 place-items-center rounded-[20px] bg-[var(--accent)] text-[var(--ink)]">
              <Icon size={24} />
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/70">
              {business.open ? "Open now" : "Closed"}
            </span>
          </div>
          <h2
            id="business-title"
            className="mt-8 text-3xl font-black tracking-[-0.055em]"
          >
            {business.name}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {business.category} · {business.neighborhood} · {business.distance}
          </p>
          <div className="mt-7 rounded-[22px] border border-white/12 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
              Program
            </p>
            <p className="mt-2 text-xl font-black">{business.reward}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Earn after an eligible purchase. Staff confirms every earn and
              redemption event.
            </p>
          </div>
        </section>
        <div className="px-5 pt-6">
          <section className="mb-4 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
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
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
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
                className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4"
              >
                <Check size={16} className="text-[var(--success)]" />
                <p className="mt-5 text-sm font-extrabold">{title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {detail}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-[rgb(15_118_85/9%)] p-4">
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
            onClick={onJoin}
            className={`mt-5 min-h-12 w-full rounded-full text-sm font-extrabold ${joined ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]" : "bg-[var(--ink)] text-[var(--paper)]"}`}
          >
            {joined ? "Already in your wallet" : `Join ${business.name}`}
          </button>
        </div>
      </div>
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
      <div className="px-5 pb-12 pt-6">
        <section className="loyalty-ticket rounded-[28px] p-6 text-[var(--paper)]">
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <WalletCards size={20} />
            </span>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/70">
              {card.kind}
            </span>
          </div>
          <h2
            id="wallet-card-title"
            className="mt-8 text-2xl font-black tracking-[-0.045em]"
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
        <section className="mt-4 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
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
                <span className="text-xs font-black">{activity.value}</span>
              </div>
            ))}
        </section>
        <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5">
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

function ProfileSheet({
  title,
  close,
  notify,
}: {
  title: string;
  close: () => void;
  notify: (message: string) => void;
}) {
  const isPersonal = title === "Personal information";
  const isNotifications = title === "Notifications" || title === "App settings";
  const isDanger = title === "Leave or delete";
  const [channelSettings, setChannelSettings] = useState([
    true,
    true,
    true,
    false,
    false,
  ]);
  const [personal, setPersonal] = useState({
    name: customerDemo.profile.name,
    birthday: customerDemo.profile.birthday,
    email: customerDemo.profile.email,
    mobile: customerDemo.profile.mobile,
  });
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leftBusinesses, setLeftBusinesses] = useState<string[]>([]);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-sheet-title"
    >
      <SheetHeader title={title} close={close} />
      <div className="px-5 pb-12 pt-6">
        <Eyebrow>Your control</Eyebrow>
        <h2
          id="profile-sheet-title"
          className="mt-2 text-2xl font-black tracking-[-0.045em]"
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
              onClick={() => notify("Profile changes saved on this device.")}
              className="min-h-12 w-full rounded-full bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)]"
            >
              Save changes
            </button>
          </div>
        ) : isNotifications ? (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
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
            <div className="rounded-[24px] border border-[rgb(217_87_67/30%)] bg-[rgb(217_87_67/8%)] p-5">
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
              className="mt-4 min-h-12 w-full rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-sm font-bold"
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
                setDeletionRequested(true);
                notify("Account deletion request queued for identity review.");
              }}
              className="mt-2 min-h-12 w-full rounded-full bg-[var(--danger)] text-sm font-extrabold text-white disabled:opacity-65"
            >
              {deletionRequested
                ? "Deletion request received"
                : "Request account deletion"}
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
              <ShieldCheck className="text-[var(--success)]" />
              <p className="mt-5 text-sm font-extrabold">
                A complete, readable record
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                Review joined businesses, fields shared, lawful purpose, channel
                consent, changes, and the date each choice took effect.
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
                  <ChevronRight size={15} />
                </div>
              ))}
            </div>
            {title === "Download my data" && (
              <button
                type="button"
                disabled={exportRequested}
                onClick={() => {
                  setExportRequested(true);
                  notify("Portable data export is being prepared.");
                }}
                className="mt-5 min-h-12 w-full rounded-full bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)] disabled:opacity-65"
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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState(() =>
    customerDemo.discover
      .filter((business) => business.joined)
      .map((business) => business.id),
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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
    wallet: <WalletView onCard={(id) => setSheet({ kind: "wallet", id })} />,
    discover: (
      <DiscoverView
        joinedIds={joinedIds}
        onBusiness={(id) => setSheet({ kind: "business", id })}
      />
    ),
    profile: (
      <ProfileView onOpen={(title) => setSheet({ kind: "profile", title })} />
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
        Skip to wallet
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className="relative mx-auto min-h-[100dvh] max-w-[460px] overflow-hidden border-x border-[rgb(37_29_24/8%)] bg-[var(--paper)] phone-shell"
      >
      <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-[var(--line)] bg-[rgb(247_243_236/90%)] px-5 backdrop-blur-xl">
        <BrandMark compact />
        <span className="sr-only">{titles[tab]}</span>
        <button
          type="button"
          onClick={() => setSheet({ kind: "notifications" })}
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--accent)]" />
        </button>
      </header>

      <div
        className="customer-scroll max-h-[calc(100dvh-68px)] min-h-[calc(100dvh-68px)] overflow-y-auto"
        aria-live="polite"
      >
        {content}
      </div>

      <button
        type="button"
        onClick={() => setQrOpen(true)}
        className="absolute bottom-[76px] left-1/2 z-40 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] shadow-[0_12px_30px_rgb(37_29_24/28%)] transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)]">
          <QrCode size={17} />
        </span>{" "}
        My QR
      </button>

      <nav
        className="absolute inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-4 border-t border-[var(--line)] bg-[rgb(255_253_249/94%)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
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

      {qrOpen && <QrModal close={() => setQrOpen(false)} />}
      {sheet?.kind === "notifications" && (
        <NotificationSheet close={() => setSheet(null)} />
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
          close={() => setSheet(null)}
          notify={setToast}
        />
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-24 left-4 right-4 z-[70] flex items-center gap-3 rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--paper)] shadow-2xl"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--success)]">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
            className="grid size-8 place-items-center rounded-full text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
      </main>
    </>
  );
}
