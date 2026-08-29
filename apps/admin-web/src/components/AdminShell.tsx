"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@kypstamping/ui";
import { signOut } from "@kypstamping/ui/auth";
import { relativeTime } from "@kypstamping/ui/format";
import {
  useAuditLedger,
  useSupportQueue,
  useTenants,
} from "@kypstamping/api";
import { useAdminState } from "@/components/AdminState";
import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  CircleGauge,
  Coins,
  FileClock,
  LifeBuoy,
  LogOut,
  Menu,
  PlugZap,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

export type AdminView =
  | "overview"
  | "businesses"
  | "people"
  | "operations"
  | "integrations"
  | "support"
  | "audit"
  | "economics"
  | "settings";

const nav = [
  { label: "Overview", icon: CircleGauge, view: "overview" as AdminView },
  { label: "Businesses", icon: Building2, view: "businesses" as AdminView },
  { label: "People", icon: Users, view: "people" as AdminView },
  { label: "Operations", icon: Activity, view: "operations" as AdminView },
  {
    label: "Integrations",
    icon: PlugZap,
    view: "integrations" as AdminView,
  },
  {
    label: "Support queue",
    icon: LifeBuoy,
    countsOpenTickets: true,
    view: "support" as AdminView,
  },
  { label: "Audit ledger", icon: FileClock, view: "audit" as AdminView },
  { label: "Revenue & margin", icon: Coins, view: "economics" as AdminView },
  {
    label: "Platform settings",
    icon: Settings2,
    view: "settings" as AdminView,
  },
];

export function AdminShell({
  children,
  activeView,
  onNavigate,
}: {
  children: ReactNode;
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
}) {
  const { data: tenants = [] } = useTenants();
  const { data: support = [] } = useSupportQueue();
  const { data: audit = [] } = useAuditLedger();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  // Live count, so resolving a ticket actually clears the badge.
  const { openTicketCount } = useAdminState();

  useEffect(() => {
    if (!accountOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [accountOpen]);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function navigate(view: AdminView) {
    onNavigate(view);
    setMobileOpen(false);
    setAccountOpen(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? [
        ...nav
          .filter((item) => item.label.toLowerCase().includes(query))
          .map((item) => ({
            key: `view-${item.view}`,
            label: item.label,
            hint: "Control-room view",
            icon: item.icon,
            view: item.view,
          })),
        ...tenants
          .filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.city.toLowerCase().includes(query),
          )
          .map((item) => ({
            key: `biz-${item.id}`,
            label: item.name,
            hint: `Tenant · ${item.city} · ${item.plan}`,
            icon: Building2,
            view: "businesses" as AdminView,
          })),
        ...support
          .filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              item.business.toLowerCase().includes(query) ||
              item.id.toLowerCase().includes(query),
          )
          .map((item) => ({
            key: `tix-${item.id}`,
            label: item.title,
            hint: `Support · ${item.business} · ${item.priority}`,
            icon: LifeBuoy,
            view: "support" as AdminView,
          })),
        ...audit
          .filter(
            (item) =>
              item.action.toLowerCase().includes(query) ||
              item.actor.toLowerCase().includes(query),
          )
          .map((item) => ({
            key: `aud-${item.id}`,
            label: item.action,
            hint: `Audit · ${item.actor} · ${relativeTime(item.occurredAt)}`,
            icon: FileClock,
            view: "audit" as AdminView,
          })),
      ].slice(0, 8)
    : [];

  const navContent = nav.map((item) => {
    const Icon = item.icon;
    const active = activeView === item.view;
    const count = "countsOpenTickets" in item ? openTicketCount : 0;
    return (
      <button
        type="button"
        key={item.label}
        onClick={() => navigate(item.view)}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${active ? "bg-[var(--paper)] text-[var(--ink)]" : "text-white/70 hover:bg-white/7 hover:text-white"}`}
      >
        <Icon size={17} aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        {count > 0 && (
          <span className="grid min-w-6 place-items-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--ink)]">
            {count}
          </span>
        )}
      </button>
    );
  });

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-xl transition focus:translate-y-0"
      >
        Skip to control room
      </a>
      <aside className="sticky top-0 hidden h-[100dvh] overflow-hidden bg-[var(--ink)] px-4 py-5 text-[var(--paper)] lg:flex lg:flex-col">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgb(232_163_61/20%),transparent_64%)]" />
        <div className="relative px-2">
          <BrandMark inverse label="KYPStamping Platform" />
        </div>

        <nav
          className="relative mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1"
          aria-label="Platform navigation"
        >
          {navContent}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">
            <ShieldCheck size={14} /> Secure session
          </div>
          <p className="mt-3 text-sm font-bold">Platform Administrator</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Privileged actions will be recorded in the audit ledger.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 text-xs font-extrabold text-white/78 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} /> Sign out securely
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-17 items-center gap-4 border-b border-[var(--line)] bg-[rgb(250_248_243/90%)] px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label={
              mobileOpen
                ? "Close platform navigation"
                : "Open platform navigation"
            }
            className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="relative hidden min-h-10 max-w-md flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 sm:flex">
            <Search
              size={16}
              className="text-[var(--muted)]"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearch("");
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault();
                  navigate(searchResults[0].view);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              placeholder="Search businesses, people, or events"
              aria-label="Search platform"
            />
            <kbd className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-[10px] font-bold text-[var(--muted)]">
              Ctrl K
            </kbd>
            {search && (
              <span className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xl">
                {searchResults.length ? (
                  searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          navigate(item.view);
                          setSearch("");
                        }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                      >
                        <Icon size={16} aria-hidden="true" className="shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">
                            {item.label}
                          </span>
                          <span className="block truncate text-[10px] font-semibold text-[var(--muted)]">
                            {item.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="block px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                    No matching view, tenant, ticket, or audit event.
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">

            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("support")}
              className="relative grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] transition hover:bg-[var(--surface-2)]"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--accent)]" />
            </button>
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                aria-label="Open administrator account menu"
                aria-haspopup="true"
                aria-expanded={accountOpen}
                aria-controls="admin-account-menu"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 pr-3"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[var(--ink)] text-[10px] font-extrabold text-[var(--paper)]">
                  AD
                </span>
                <ChevronDown size={14} className={`transition ${accountOpen ? "rotate-180" : ""}`} />
              </button>
              {accountOpen && (
                <div id="admin-account-menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xl">
                  <div className="border-b border-[var(--line)] px-3 pb-3 pt-2">
                    <p className="text-xs font-extrabold">Platform Administrator</p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">admin@kypstamping.ph</p>
                  </div>
                  <button type="button" onClick={() => navigate("settings")} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]"><Settings2 size={15} /> Administrator settings</button>
                  <button type="button" onClick={() => navigate("audit")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold hover:bg-[var(--surface-2)]"><FileClock size={15} /> My audit activity</button>
                  <button type="button" onClick={() => signOut()} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-[var(--danger)] hover:bg-[rgb(178_59_43/8%)]"><LogOut size={15} /> Sign out securely</button>
                </div>
              )}
            </div>
          </div>
        </header>
        {mobileOpen && (
          <div className="fixed inset-0 top-17 z-40 overflow-y-auto bg-[var(--ink)] p-4 lg:hidden">
            <div className="mb-6">
              <BrandMark inverse label="KYPStamping Platform" />
            </div>
            <nav className="space-y-1" aria-label="Mobile platform navigation">
              {navContent}
            </nav>
            <button type="button" onClick={() => signOut()} className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/7 text-sm font-extrabold text-white"><LogOut size={16} /> Sign out securely</button>
          </div>
        )}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
