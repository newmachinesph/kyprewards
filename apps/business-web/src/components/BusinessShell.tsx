"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useBusinessProfile, useWorkspaces } from "@kypstamping/api";
import { BrandMark } from "@kypstamping/ui";
import { signOut } from "@kypstamping/ui/auth";
import { useDemoState } from "@/components/DemoState";
import { planFor, usePlanGate } from "@/lib/plan";
import {
  BarChart3,
  Bell,
  CakeSlice,
  ChevronDown,
  CreditCard,
  Crown,
  Gift,
  HandCoins,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Megaphone,
  MessageSquareText,
  PlugZap,
  QrCode,
  ScanLine,
  Settings2,
  Store,
  Target,
  TicketCheck,
  TicketPercent,
  Timer,
  Users,
  UserRoundCog,
  WalletCards,
  X,
} from "lucide-react";

export type BusinessView =
  | "dashboard"
  | "scan"
  | "join-code"
  | "customers"
  | "business"
  | "programs"
  | "bonus-windows"
  | "promo-codes"
  | "store-credit"
  | "suki-tiers"
  | "missions"
  | "gifts"
  | "favorite-orders"
  | "birthday"
  | "redemptions"
  | "campaigns"
  | "message-log"
  | "analytics"
  | "integrations"
  | "staff"
  | "billing"
  | "settings";

/** The tier each gated screen needs, from `plans.ts` by way of the matrix. */
const navPlan = {
  integrations: planFor("API access"),
  "bonus-windows": planFor("Bonus windows"),
  "promo-codes": planFor("Promo codes"),
  "store-credit": planFor("Store credit"),
  "suki-tiers": planFor("Suki tiers"),
  missions: planFor("Missions"),
  gifts: planFor("Send a reward as a gift"),
} as const;

const navigation = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        view: "dashboard" as BusinessView,
      },
      { label: "Scan", icon: ScanLine, view: "scan" as BusinessView },
      {
        label: "My join code",
        icon: QrCode,
        view: "join-code" as BusinessView,
      },
      { label: "Customers", icon: Users, view: "customers" as BusinessView },
      { label: "Business", icon: Store, view: "business" as BusinessView },
      {
        label: "Integrations",
        icon: PlugZap,
        view: "integrations" as BusinessView,
        plan: navPlan.integrations,
      },
    ],
  },
  {
    label: "Loyalty",
    items: [
      { label: "Program", icon: WalletCards, view: "programs" as BusinessView },
      {
        label: "Bonus windows",
        icon: Timer,
        view: "bonus-windows" as BusinessView,
        plan: navPlan["bonus-windows"],
      },
      {
        label: "Promo codes",
        icon: TicketPercent,
        view: "promo-codes" as BusinessView,
        plan: navPlan["promo-codes"],
      },
      {
        label: "Store credit",
        icon: HandCoins,
        view: "store-credit" as BusinessView,
        plan: navPlan["store-credit"],
      },
      {
        label: "Suki tiers",
        icon: Crown,
        view: "suki-tiers" as BusinessView,
        plan: navPlan["suki-tiers"],
      },
      {
        label: "Missions",
        icon: Target,
        view: "missions" as BusinessView,
        plan: navPlan.missions,
      },
      {
        label: "Gifts",
        icon: Gift,
        view: "gifts" as BusinessView,
        plan: navPlan.gifts,
      },
      {
        label: "Favorite orders",
        icon: Heart,
        view: "favorite-orders" as BusinessView,
      },
      {
        label: "Birthday offers",
        icon: CakeSlice,
        view: "birthday" as BusinessView,
      },
      { label: "Redemptions", icon: TicketCheck, view: "redemptions" as BusinessView },
    ],
  },
  {
    label: "Reach",
    items: [
      {
        label: "Campaigns",
        icon: Megaphone,
        view: "campaigns" as BusinessView,
      },
      {
        label: "Message log",
        icon: MessageSquareText,
        view: "message-log" as BusinessView,
      },
      {
        label: "Analytics",
        icon: BarChart3,
        view: "analytics" as BusinessView,
      },
    ],
  },
];

/** The account group under the nav: people, money, the workspace itself. */
const accountItems = [
  { label: "Staff & access", icon: UserRoundCog, view: "staff" as BusinessView },
  { label: "Billing & plan", icon: CreditCard, view: "billing" as BusinessView },
  { label: "Settings", icon: Settings2, view: "settings" as BusinessView },
];

/**
 * Screens a Cashier has no use for and should not be offered.
 *
 * The API is the boundary and holds - every write is refused with "A Cashier
 * cannot do that" - but a nav that lists Billing, Analytics and Staff for a
 * front-line role invites somebody to go looking, and the pages that do
 * render leak the shape of the business: plan, renewal date, the roster.
 */
const OWNER_ONLY: ReadonlySet<BusinessView> = new Set<BusinessView>([
  "analytics",
  "campaigns",
  "integrations",
  "settings",
  "billing",
  "bonus-windows",
  "promo-codes",
  "suki-tiers",
  "missions",
  "gifts",
]);

export function BusinessShell({
  children,
  activeView,
  onNavigate,
}: {
  children: ReactNode;
  activeView: BusinessView;
  onNavigate: (view: BusinessView) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // Whatever onboarding configured, falling back to the fixture workspace when
  // the merchant signed in instead of signing up.
  const { workspace } = useDemoState();
  // The wizard's answer wins while it is still in session storage; after that
  // the workspace is whatever the API says it is.
  const { data: profile } = useBusinessProfile();
  const { data: workspaces = [] } = useWorkspaces();
  const gate = usePlanGate();
  const role = workspaces.find((entry) => entry.merchantId === profile?.merchantId)?.role ?? "";
  const frontLine = role === "Cashier";
  const workspaceName = workspace?.businessName ?? profile?.shortName ?? "";
  const workspaceInitials = workspaceName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accountOpen]);

  function navigate(view: BusinessView) {
    onNavigate(view);
    setMobileOpen(false);
    setAccountOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navigationContent = (
    <>
      {navigation.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              if (frontLine && OWNER_ONLY.has(item.view)) return null;
              const Icon = item.icon;
              const active = activeView === item.view;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${active ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"}`}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.label}</span>
                  {"plan" in item && item.plan && !gate.covers(item.plan) && (
                    <span
                      title={`Opens with ${item.plan}`}
                      className={`rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] ${active ? "bg-white/15 text-[var(--accent)]" : "bg-[rgb(232_163_61/18%)] text-[var(--accent-strong)]"}`}
                    >
                      {item.plan}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--paper)] shadow-xl transition focus:translate-y-0"
      >
        Skip to workspace
      </a>
      <aside className="sticky top-0 hidden h-[100dvh] border-r border-[var(--line)] bg-[rgb(255_254_251/86%)] px-4 py-5 backdrop-blur-xl md:flex md:flex-col">
        <div className="px-2">
          <BrandMark />
        </div>

        <nav
          className="app-scrollbar mt-9 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1"
          aria-label="Business navigation"
        >
          {navigationContent}
        </nav>

        <div className="mt-auto space-y-2 border-t border-[var(--line)] pt-4">
          {accountItems.map((item) => {
            if (frontLine && OWNER_ONLY.has(item.view)) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                aria-current={activeView === item.view ? "page" : undefined}
                className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold ${activeView === item.view ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"}`}
              >
                <Icon size={17} aria-hidden="true" /> {item.label}
              </button>
            );
          })}
          <div className="relative mt-3">
            {accountOpen && (
              <div
                id="business-account-menu"
                role="menu"
                className="absolute bottom-[calc(100%+8px)] left-0 right-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-2xl"
              >
                <button type="button" role="menuitem" onClick={() => window.location.replace("/workspaces")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]">
                  <Store size={15} /> Switch workspace
                </button>
                <button type="button" role="menuitem" onClick={() => navigate("settings")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]">
                  <Settings2 size={15} /> Account settings
                </button>
                {!frontLine && (
                  <button type="button" role="menuitem" onClick={() => navigate("billing")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]">
                    <CreditCard size={15} /> Billing & plan
                  </button>
                )}
                <button type="button" role="menuitem" onClick={() => navigate("settings")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]">
                  <LifeBuoy size={15} /> Support
                </button>
                <button type="button" role="menuitem" onClick={() => signOut()} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-[var(--danger)] hover:bg-[rgb(178_59_43/8%)]">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-controls="business-account-menu"
              onClick={() => setAccountOpen((open) => !open)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 text-left transition hover:bg-[var(--surface-2)]"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-xs font-extrabold">
                {workspaceInitials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">
                  {workspaceName}
                </span>
                {/* The signed-in person's actual role. This read "Owner
                    workspace" to everybody, including the cashier on the till
                    tablet, whose session is nothing of the kind. */}
                <span className="block truncate text-[10px] text-[var(--muted)]">
                  {role ? `${role} workspace` : "Workspace"}
                </span>
              </span>
              <ChevronDown size={14} className={`transition ${accountOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[rgb(250_248_243/92%)] px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <BrandMark compact />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("message-log")}
              className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
            >
              <Bell size={18} />
            </button>
            <a
              href="/workspaces"
              aria-label="Switch workspace"
              className="grid size-10 place-items-center rounded-full bg-[var(--accent)] text-xs font-extrabold"
            >
              {workspaceInitials}
            </a>
          </div>
        </header>
        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-[rgb(250_248_243/98%)] p-4 backdrop-blur-xl md:hidden">
            <nav className="space-y-6" aria-label="Mobile business navigation">
              {navigationContent}
            </nav>
            <div className="mt-6 grid gap-2 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
              {accountItems.map((item) => {
                if (frontLine && OWNER_ONLY.has(item.view)) return null;
                const Icon = item.icon;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => navigate(item.view)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm font-bold"
                  >
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => signOut()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[rgb(178_59_43/28%)] bg-[rgb(178_59_43/7%)] text-sm font-bold text-[var(--danger)]"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        )}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
