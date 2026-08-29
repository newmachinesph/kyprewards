"use client";

import { useEffect, useState, type ReactNode } from "react";
import { business, sharedScenario } from "@kypstamping/demo-data";
import { Button, Eyebrow, Pill, StampDots, ViewFrame } from "@kypstamping/ui";
import {
  daysUntilBirthday,
  longDate,
  peso,
  pesoCompact,
  pesoCompactFromCentavos,
  pesoFromCentavos,
  relativeTime,
  timeOfDay,
} from "@kypstamping/ui/format";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CakeSlice,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileDown,
  Gift,
  Heart,
  Link2,
  Mail,
  MessageCircle,
  MessagesSquare,
  MessageSquareText,
  Nfc,
  Pencil,
  Phone,
  PlugZap,
  Plus,
  QrCode,
  Search,
  Send,
  Route,
  ShieldCheck,
  Smartphone,
  Stamp,
  Store,
  TicketCheck,
  UserPlus,
  Users,
  WalletCards,
  WifiOff,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import type { BusinessView } from "@/components/BusinessShell";
import { useDemoState } from "@/components/DemoState";
import { IntegrationsView } from "@/components/IntegrationsView";

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

type Notify = (message: string, intent?: NotifyIntent) => void;


function ScanView({ notify }: { notify: Notify }) {
  // The dashboard scanner already picked the demo customer; arriving here and
  // being asked to pick again broke the flow.
  const { scanHandoff, consumeScanHandoff } = useDemoState();
  const [step, setStep] = useState<"ready" | "found" | "complete">(
    scanHandoff ? "found" : "ready",
  );
  useEffect(() => {
    if (scanHandoff) consumeScanHandoff();
  }, [scanHandoff, consumeScanHandoff]);
  const [amount, setAmount] = useState(String(sharedScenario.purchase.amount));
  const [lastVisit, setLastVisit] = useState<{ stamps: number; amount: number } | null>(null);
  // The counter re-enacts the shared visit, so it has to start where that
  // event started. Beginning at the *result* produced a stamp count no other
  // app agreed with.
  const stampsBefore = sharedScenario.loyaltyEvent.beforeStamps;
  const stampTarget = sharedScenario.loyaltyEvent.target;
  return (
    <ViewFrame
      eyebrow="Counter"
      title="Scan a customer"
      description="A guided earn-and-redeem flow that remains safe and understandable during the busiest part of service."
      action={
        <Pill tone="success">
          <WifiOff size={12} className="mr-1.5" /> Offline queue ready
        </Pill>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
          <div className="flex items-center justify-between">
            <Eyebrow>Secure scanner</Eyebrow>
            <span className="font-mono text-[10px] text-white/60">
              CAMERA 01
            </span>
          </div>
          {step === "ready" && (
            <div className="mx-auto mt-8 max-w-sm">
              <div className="relative aspect-square rounded-[var(--radius-card)] border border-white/15 bg-white/[0.04] p-12">
                <span className="absolute left-5 top-5 size-16 border-l-2 border-t-2 border-[var(--accent)]" />
                <span className="absolute right-5 top-5 size-16 border-r-2 border-t-2 border-[var(--accent)]" />
                <span className="absolute bottom-5 left-5 size-16 border-b-2 border-l-2 border-[var(--accent)]" />
                <span className="absolute bottom-5 right-5 size-16 border-b-2 border-r-2 border-[var(--accent)]" />
                <QrCode className="size-full text-white/65" strokeWidth={1} />
              </div>
              <p className="mt-5 text-center text-sm text-white/65">
                Scan the customer QR, saved image, or printed card — or choose the demo customer.
              </p>
              <Button
                tone="accent"
                className="mt-5 w-full"
                onClick={() => setStep("found")}
              >
                Use demo customer
              </Button>
            </div>
          )}
          {step === "found" && (
            <div className="mt-8">
              <div className="rounded-2xl bg-[var(--surface)] p-5 text-[var(--ink)]">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-lg font-extrabold">
                    {business.customers[0].initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{sharedScenario.customer}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {business.customers[0].segment} · {business.customers[0].visits} visits ·{" "}
                      {business.customers[0].risk.toLowerCase()}
                    </p>
                  </div>
                  <BadgeCheck className="text-[var(--success)]" />
                </div>
                <div className="mt-6 rounded-2xl bg-[var(--paper)] p-4">
                  <p className="text-xs font-bold text-[var(--muted)]">
                    Eligible program
                  </p>
                  <p className="mt-1 font-extrabold">Eight visits, pastry on us</p>
                  <div className="mt-4 overflow-x-auto">
                    <StampDots filled={stampsBefore} total={stampTarget} />
                  </div>
                </div>
                <label className="mt-5 grid gap-2 text-xs font-bold">
                  Purchase amount, optional
                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value.replace(/[^\d.]/g, ""))
                    }
                    inputMode="decimal"
                    aria-describedby="scan-amount-help"
                    className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
                  />
                  <span
                    id="scan-amount-help"
                    className="text-[10px] font-semibold text-[var(--muted)]"
                  >
                    Recorded with the visit. Leave blank for a visit-only stamp.
                  </span>
                </label>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button tone="quiet" onClick={() => setStep("ready")}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const parsed = Number.parseFloat(amount);
                      if (amount.trim() && (!Number.isFinite(parsed) || parsed < 0)) {
                        notify("Enter a valid purchase amount, or clear the field.", "error");
                        return;
                      }
                      const recorded = amount.trim() ? parsed : 0;
                      setLastVisit({ stamps: stampsBefore + 1, amount: recorded });
                      setStep("complete");
                      notify(
                        recorded
                          ? `Visit approved. ${peso(recorded)} recorded with the stamp.`
                          : "Visit approved as a visit-only stamp.",
                      );
                    }}
                  >
                    Approve +1 stamp
                  </Button>
                </div>
              </div>
            </div>
          )}
          {step === "complete" && (
            <div className="grid min-h-[500px] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--success)]">
                  <Check size={36} strokeWidth={3} />
                </span>
                <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.02em]">
                  Stamp added.
                </h2>
                <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-white/65">
                  {sharedScenario.customer} now has{" "}
                  {lastVisit?.stamps ?? stampsBefore + 1} of {stampTarget} stamps
                  {lastVisit?.amount
                    ? ` from a ${peso(lastVisit.amount)} purchase`
                    : ""}
                  . Nothing is written to a server in this demo.
                </p>
                <Button
                  tone="accent"
                  className="mt-6"
                  onClick={() => {
                    setAmount(String(sharedScenario.purchase.amount));
                    setStep("ready");
                  }}
                >
                  Scan next customer
                </Button>
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Recent counter activity</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                Today at {sharedScenario.branch}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => notify("Redemption ledger opened.", "review")}
              className="text-xs font-bold text-[var(--accent-strong)]"
            >
              View ledger
            </button>
          </div>
          <article className="mt-5 rounded-2xl border border-[rgb(15_118_85/24%)] bg-[rgb(15_118_85/7%)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--success)]">
                  Shared demo event · recorded
                </p>
                <p className="mt-1 text-sm font-extrabold">
                  {sharedScenario.customer} · {sharedScenario.purchase.display}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {sharedScenario.loyaltyEvent.effect} · {sharedScenario.loyaltyEvent.after} · approved by {sharedScenario.staff}
                </p>
              </div>
              <code className="rounded-lg bg-[var(--surface)] px-2.5 py-1.5 text-[10px] font-extrabold text-[var(--muted-strong)]">
                {sharedScenario.loyaltyEvent.id}
              </code>
            </div>
          </article>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {business.redemptions.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-4"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <TicketCheck size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">{item.customer}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {item.reward} · {item.staff}
                  </p>
                </div>
                <div className="text-right">
                  <Pill
                    tone={item.status === "Approved" ? "success" : "warning"}
                  >
                    {item.status}
                  </Pill>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {timeOfDay(item.occurredAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--line-strong)] p-4">
            <div className="flex items-start gap-3">
              <Nfc size={18} className="mt-0.5 text-[var(--accent-strong)]" />
              <div>
                <p className="text-sm font-extrabold">NFC counter mode</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  Customers can tap a supported tag to open the same
                  confirmation flow. Staff still approves the value event.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}

function JoinCodeView({ notify }: { notify: Notify }) {
  const [branch, setBranch] = useState(business.locations[0].name);
  return (
    <ViewFrame
      eyebrow="Enrollment"
      title="Join codes"
      description="Use a branch-specific poster, social link, or NFC tag. Customers review terms and choose what to share before joining."
      action={
        <Button
          icon={<Download size={16} />}
          onClick={() => notify("Print-ready poster prepared for download.")}
        >
          Download poster
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          <label className="grid gap-2 text-xs font-bold">
            Location
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-sm outline-none"
            >
              {business.locations.map((location) => (
                <option key={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
          <div className="mx-auto mt-8 w-fit rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_45px_rgb(24_18_12/10%)]">
            <div className="grid grid-cols-[repeat(14,10px)] gap-[2px]">
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
          </div>
          <p className="mt-5 text-center text-lg font-extrabold">
            Join Sweet Crumbs · {branch}
          </p>
          <p className="mt-1 text-center text-xs text-[var(--muted)]">
            kypstamping.ph/join/sweet-crumbs-
            {branch.toLowerCase().replaceAll(" ", "-")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              icon={<Copy size={15} />}
              onClick={() => {
                const link = `https://kypstamping.ph/join/sweet-crumbs-${branch.toLowerCase().replaceAll(" ", "-")}`;
                navigator.clipboard?.writeText(link).catch(() => {});
                notify("Join link copied.");
              }}
            >
              Copy link
            </Button>
            <Button
              tone="quiet"
              icon={<Nfc size={15} />}
              onClick={() => notify("NFC tag setup opened in demo mode.", "review")}
            >
              Set up NFC
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <CreditCard size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">Printed member cards</p>
                  <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-[var(--muted-strong)]">
                    Wallet-sized cards carrying each customer&rsquo;s own code. For
                    customers without a smartphone, or when data is down, staff scan
                    the printed card exactly like the in-app code.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                Add-on
              </span>
            </div>
            <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
              {[
                ["Linked by", "Customer mobile number"],
                ["Minimum order", "100 cards"],
                ["Quoted separately", "Not included in plan"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[var(--paper)] p-3">
                  <dt className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                tone="quiet"
                icon={<Send size={15} />}
                onClick={() => notify("Card order request opened in demo mode.", "review")}
              >
                Request a quote
              </Button>
              <Button
                tone="quiet"
                icon={<WalletCards size={15} />}
                onClick={() => notify("Wallet pass preview opened in demo mode.", "review")}
              >
                Use wallet passes instead
              </Button>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
          <Eyebrow>What customers see</Eyebrow>
          <h2 className="mt-5 max-w-[13ch] text-3xl font-extrabold tracking-[-0.02em]">
            Join in under thirty seconds.
          </h2>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              {
                icon: Eye,
                title: "Clear program terms",
                text: "Reward, expiry, earning, and redemption terms appear before joining.",
              },
              {
                icon: ShieldCheck,
                title: "Purpose-by-purpose choice",
                text: "Service updates, promotions, email, SMS, push, and location are separate controls.",
              },
              {
                icon: Smartphone,
                title: "No app-store gate",
                text: "The PWA opens immediately; a quick wallet pass is optional.",
              },
              {
                icon: WifiOff,
                title: "Works without a signal",
                text: "Customers can save or print their code, or carry a printed member card, and still be scanned.",
              },
              {
                icon: Link2,
                title: "One identity, private by design",
                text: "The business receives only the customer details approved for this program.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}

function CustomersView({ notify }: { notify: Notify }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All");
  const [selectedId, setSelectedId] = useState(business.customers[0].id);
  const filtered = business.customers.filter(
    (customer) =>
      (segment === "All" || customer.segment === segment) &&
      customer.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected =
    business.customers.find((customer) => customer.id === selectedId) ??
    business.customers[0];
  return (
    <ViewFrame
      eyebrow="Customer CRM"
      title="Customers"
      description="Understand the relationship without turning people into a contact export. Profile access follows the customer’s sharing choices."
      action={
        <Button
          icon={<FileDown size={16} />}
          onClick={() => notify("Permission-aware customer export prepared.")}
        >
          Export view
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="grid gap-3 border-b border-[var(--line)] p-4 sm:grid-cols-[1fr_auto]">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search customers"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search customers"
              />
            </label>
            <select
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              aria-label="Filter customers by lifecycle segment"
              className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-bold"
            >
              {[
                "All",
                "VIP",
                "Regular",
                "Almost regular",
                "New",
                "At risk",
                "Lapsed",
                "Reward ready",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-4 py-3">Lifecycle</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Last visit</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    aria-label={`Open ${customer.name}`}
                    onClick={() => setSelectedId(customer.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(customer.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] transition focus-visible:outline-2 focus-visible:outline-[var(--accent)] last:border-0 ${selected.id === customer.id ? "bg-[rgb(232_163_61/9%)]" : "hover:bg-[var(--paper)]"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                          {customer.initials}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">{customer.name}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                            {customer.favorite}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          customer.risk === "High"
                            ? "danger"
                            : customer.segment === "VIP"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {customer.segment}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {customer.visits}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {pesoFromCentavos(customer.lifetimeValueCentavos)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {relativeTime(customer.lastVisitAt)}
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <Users className="mx-auto text-[var(--muted)]" />
                <p className="mt-4 text-sm font-extrabold">
                  No customers match this view.
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Clear the search or choose another lifecycle segment.
                </p>
              </div>
            )}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-lg font-extrabold text-[var(--ink)]">
              {selected.initials}
            </span>
            <div>
              <p className="text-lg font-extrabold">{selected.name}</p>
              <p className="mt-1 text-xs text-white/60">
                {selected.segment} · {selected.risk}
              </p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Visits", selected.visits],
              ["Lifetime value", pesoFromCentavos(selected.lifetimeValueCentavos)],
              ["Progress", selected.progress],
              ["Birthday", selected.birthday],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/50">
                  {label}
                </p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Favorite order
            </p>
            <p className="mt-2 text-sm font-bold">{selected.favorite}</p>
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Reachable by consent
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["Email", selected.emailConsent],
                ["SMS", selected.smsConsent],
                ["Push", selected.pushConsent],
              ].map(([label, allowed]) => (
                <span
                  key={String(label)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${allowed ? "bg-[rgb(15_118_85/28%)] text-[#8ee0c2]" : "bg-white/7 text-white/50"}`}
                >
                  {label} · {allowed ? "Allowed" : "Off"}
                </span>
              ))}
            </div>
          </div>
          <Button
            tone="accent"
            className="mt-8 w-full"
            icon={<MessageCircle size={16} />}
            onClick={() => notify(`Draft opened for ${selected.name}.`, "review")}
          >
            Create personal note
          </Button>
        </aside>
      </div>
    </ViewFrame>
  );
}

function BusinessProfileView({ notify }: { notify: Notify }) {
  return (
    <ViewFrame
      eyebrow="Business profile"
      title="Locations & identity"
      description="Keep public discovery details, local operating settings, and branch performance in one place."
      action={
        <Button
          icon={<Plus size={16} />}
          onClick={() => notify("New location setup opened in demo mode.", "review")}
        >
          Add location
        </Button>
      }
    >
      <section className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="overflow-hidden rounded-xl bg-[var(--ink)] text-[var(--paper)]">
          <div className="h-36 overflow-hidden">
            <img
              src="/images/sweet-crumbs.webp"
              alt="Inside the Sweet Crumbs Kapitolyo shop"
              width={1200}
              height={800}
              className="size-full object-cover"
            />
          </div>
          <div className="p-6">
          <h2 className="mt-2 text-2xl font-extrabold">{business.profile.name}</h2>
          <p className="mt-2 text-sm text-white/60">
            {business.profile.category} · owned by {business.profile.owner}
          </p>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              ["Plan", business.profile.plan],
              ["Billing", business.profile.billing],
              ["Renewal", longDate(business.profile.renewalOn)],
              ["Timezone", business.profile.timezone],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="text-white/55">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
          <Button
            tone="accent"
            className="mt-6"
            icon={<Pencil size={15} />}
            onClick={() => notify("Business profile editor opened.", "review")}
          >
            Edit public profile
          </Button>
        </div>
        </article>
        <div className="space-y-3">
          {business.locations.map((location, index) => (
            <article
              key={location.id}
              className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span
                className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}
              >
                <Store size={19} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold">{location.name}</h3>
                  <Pill
                    tone={location.status === "Live" ? "success" : "warning"}
                  >
                    {location.status}
                  </Pill>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {location.address}
                </p>
                <p className="mt-2 text-[10px] font-bold text-[var(--muted)]">
                  {location.staff} staff · {location.members.toLocaleString()}{" "}
                  members
                </p>
              </div>
              <button
                type="button"
                aria-label={`Open ${location.name} settings`}
                onClick={() => notify(`${location.name} settings opened.`, "review")}
                className="grid size-10 place-items-center rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)]"
              >
                <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </ViewFrame>
  );
}

const programIcons: Record<string, typeof Stamp> = {
  Stamps: Stamp,
  Points: Coins,
  Discount: CreditCard,
  Membership: BadgeCheck,
  Coupon: TicketCheck,
  Rewards: Gift,
  Multipass: WalletCards,
  "Gift card": CreditCard,
};

const PROGRAM_STATUSES = ["Live", "Ready", "Draft"] as const;

function ProgramsView({ notify }: { notify: Notify }) {
  const { programs, duplicateProgram, updateProgramRule } = useDemoState();
  const [selectedId, setSelectedId] = useState(programs[0].id);
  const [editing, setEditing] = useState(false);
  const selected =
    programs.find((program) => program.id === selectedId) ?? programs[0];
  return (
    <ViewFrame
      eyebrow="Loyalty engine"
      title="Programs"
      description="Run all eight proven loyalty mechanics from one rules engine while preserving every customer’s earned value."
      action={
        <Button
          icon={<Plus size={16} />}
          onClick={() => notify("New program template picker opened.", "review")}
        >
          New program
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="grid sm:grid-cols-2">
            {programs.map((program, index) => {
              const Icon = programIcons[program.type] ?? Gift;
              const active = selected.id === program.id;
              return (
                <button
                  type="button"
                  key={program.id}
                  onClick={() => setSelectedId(program.id)}
                  className={`min-h-44 border-[var(--line)] p-5 text-left transition ${index > 1 ? "border-t" : ""} ${index % 2 === 1 ? "sm:border-l" : ""} ${index === 1 ? "border-t sm:border-t-0" : ""} ${active ? "bg-[var(--accent)]" : "hover:bg-[var(--paper)]"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--paper)]">
                      <Icon size={18} />
                    </span>
                    <Pill
                      tone={
                        program.status === "Live"
                          ? "success"
                          : program.status === "Ready"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {program.status}
                    </Pill>
                  </div>
                  <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                    {program.type}
                  </p>
                  <h3 className="mt-1 text-base font-extrabold">{program.name}</h3>
                </button>
              );
            })}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Program record</Eyebrow>
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
            {selected.type}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
            {selected.name}
          </h2>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Members", selected.members.toLocaleString()],
              ["Completion", `${selected.completion}%`],
              ["Redemption", `${selected.redemption}%`],
              ["Liability", pesoFromCentavos(selected.liabilityCentavos)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="mt-1 text-lg font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-white/12 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--accent)]"
              />
              <p className="text-xs leading-relaxed text-white/65">
                Publishing a rule change creates a new version. Existing points,
                balances, and rewards remain protected.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {
                const draftName = duplicateProgram(selected.id);
                notify(
                  draftName
                    ? `${draftName} added to your programs as a draft.`
                    : "Could not duplicate this program.",
                  draftName ? "info" : "error",
                );
              }}
            >
              Duplicate
            </Button>
            <Button
              tone="accent"
              aria-expanded={editing}
              onClick={() => setEditing((open) => !open)}
            >
              {editing ? "Close editor" : "Edit rules"}
            </Button>
          </div>
          {editing && (
            <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
              <Eyebrow>Rule editor</Eyebrow>
              <label className="mt-4 grid gap-2 text-xs font-bold">
                Program name
                <input
                  value={selected.name}
                  onChange={(event) =>
                    updateProgramRule(selected.id, { name: event.target.value })
                  }
                  className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="text-xs font-bold">Status</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROGRAM_STATUSES.map((status) => (
                    <button
                      type="button"
                      key={status}
                      aria-pressed={selected.status === status}
                      onClick={() => updateProgramRule(selected.id, { status })}
                      className={`min-h-10 rounded-full px-3 text-xs font-bold ${
                        selected.status === status
                          ? "bg-[var(--accent)] text-[var(--ink)]"
                          : "border border-white/15 text-white/60"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="mt-4 grid gap-2 text-xs font-bold">
                Reward liability ceiling
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={selected.liabilityCentavos}
                  onChange={(event) =>
                    updateProgramRule(selected.id, {
                      liabilityCentavos: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                  className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <Button
                tone="accent"
                className="mt-5 w-full"
                onClick={() => {
                  setEditing(false);
                  notify(`${selected.name} saved as a new version in this demo.`);
                }}
              >
                Publish new version
              </Button>
            </div>
          )}
        </aside>
      </div>
    </ViewFrame>
  );
}

function FavoriteOrdersView({ notify }: { notify: Notify }) {
  const max = Math.max(...business.favoriteOrders.map((item) => item.orders));
  return (
    <ViewFrame
      eyebrow="Customer context"
      title="Favorite orders"
      description="Connect visit behavior with the items regulars actually choose. SKU context stays optional until a POS or file import is connected."
      action={
        <Button
          tone="quiet"
          icon={<PlugZap size={16} />}
          onClick={() => notify("POS connection catalog opened.", "review")}
        >
          Connect order data
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <Eyebrow>Top regular choices</Eyebrow>
          <div className="mt-6 space-y-5">
            {business.favoriteOrders.map((item, index) => (
              <div key={item.item}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      {index + 1}. {item.item}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Chosen by {item.regulars} regulars
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold">{item.orders}</p>
                    <p
                      className={`text-[10px] font-bold ${item.change >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                    style={{ width: `${(item.orders / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Useful segment</Eyebrow>
            <Heart size={19} />
          </div>
          <h2 className="mt-8 max-w-[13ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.02em]">
            Spanish latte regulars are moving earlier.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/80">
            Forty-two regulars shifted their visits from afternoon to 8–11 AM in
            the last month. The morning branch has enough capacity to welcome
            more.
          </p>
          <div className="mt-8 rounded-2xl bg-[var(--surface)] p-4">
            <p className="text-xs font-extrabold">
              Suggested audience · 248 customers
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              Use favorite-order context only for customers who chose
              personalized recommendations.
            </p>
          </div>
          <Button
            className="mt-5"
            onClick={() =>
              notify("Campaign draft created for Spanish latte regulars.")
            }
          >
            Create audience
          </Button>
        </section>
      </div>
    </ViewFrame>
  );
}

function BirthdayView({ notify }: { notify: Notify }) {
  // Was a literal list of three dates under a "next 30 days" heading, so it
  // was only ever correct on the day it was written.
  const upcoming = business.customers
    .map((customer) => ({ customer, inDays: daysUntilBirthday(customer.birthday) }))
    .filter((entry): entry is { customer: typeof entry.customer; inDays: number } =>
      entry.inDays !== null,
    )
    .sort((a, b) => a.inDays - b.inDays);
  const [channels, setChannels] = useState({
    Push: true,
    Email: true,
    SMS: false,
  });
  return (
    <ViewFrame
      eyebrow="Birthday moments"
      title="Birthday offers"
      description="Build one thoughtful birthday journey with explicit eligibility, a budget ceiling, and channel-specific consent."
      action={<Pill tone="success">Automation live</Pill>}
    >
      <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Next 30 days</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                {upcoming.length} known birthdays
              </h2>
            </div>
            <CakeSlice className="text-[var(--accent-strong)]" />
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {upcoming.map(({ customer, inDays }) => {
              // Every consented channel counts, not just SMS.
              const reachable = [
                customer.pushConsent,
                customer.emailConsent,
                customer.smsConsent,
              ].filter(Boolean).length;
              return (
                <div key={customer.id} className="flex items-center gap-3 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)] text-xs font-extrabold">
                    {customer.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {customer.birthday} ·{" "}
                      {inDays === 0 ? "today" : `in ${inDays} day${inDays === 1 ? "" : "s"}`} ·{" "}
                      {customer.favorite}
                    </p>
                  </div>
                  <Pill tone={reachable > 1 ? "success" : "neutral"}>
                    {reachable} channel{reachable === 1 ? "" : "s"}
                  </Pill>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <p className="py-6 text-xs text-[var(--muted)]">
                No known birthdays in the next 30 days.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Journey editor</Eyebrow>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Send timing
              <select className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm">
                <option>7 days before</option>
                <option>On the birthday</option>
                <option>Birthday month</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Reward
              <select className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm">
                <option>Birthday pastry</option>
                <option>Double stamp</option>
                <option>₱100 gift value</option>
              </select>
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-xs font-bold">
            Message
            <textarea
              defaultValue="A birthday treat should feel easy. Visit any Sweet Crumbs branch this week and choose a pastry on us."
              rows={4}
              className="rounded-xl border border-white/15 bg-[var(--ink-soft)] p-3 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="mt-5">
            <p className="text-xs font-bold">Delivery channels</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(channels).map(([channel, active]) => (
                <button
                  type="button"
                  key={channel}
                  aria-pressed={active}
                  onClick={() =>
                    setChannels((current) => ({
                      ...current,
                      [channel]: !active,
                    }))
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]" : "border-white/15 text-white/55"}`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/6 p-4">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />
            <p className="text-xs leading-relaxed text-white/65">
              Each channel checks current consent at delivery time. SMS is
              skipped when consent is off or the credit budget is exhausted.
            </p>
          </div>
          <Button
            tone="accent"
            className="mt-6"
            onClick={() =>
              notify("Birthday journey saved with channel guardrails.")
            }
          >
            Save journey
          </Button>
        </section>
      </div>
    </ViewFrame>
  );
}

function RedemptionsView({ notify }: { notify: Notify }) {
  // These were three hardcoded figures, one of which quoted the stamp-card
  // liability under a "reward value" label. All three now say what they count.
  const approved = business.redemptions.filter((item) => item.status === "Approved");
  const reversals = business.redemptions.length - approved.length;
  const rewardValue = approved.reduce((sum, item) => sum + item.valueCentavos, 0);
  const approvalRate = (approved.length / business.redemptions.length) * 100;
  const stampLiability =
    business.programs.find((program) => program.type === "Stamps")?.liabilityCentavos ?? 0;
  return (
    <ViewFrame
      eyebrow="Value ledger"
      title="Redemptions"
      description="Every reward event shows the customer, branch, approving staff member, value, status, and reversal path."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          onClick={() => notify("Redemption ledger export prepared.")}
        >
          Export ledger
        </Button>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-4">Customer</th>
                <th className="px-4 py-4">Reward</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Approved by</th>
                <th className="px-4 py-4">Value</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {business.redemptions.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4 text-sm font-extrabold">
                    {item.customer}
                  </td>
                  <td className="px-4 py-4 text-sm">{item.reward}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.branch}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.staff}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {item.valueCentavos ? pesoFromCentavos(item.valueCentavos) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={item.status === "Approved" ? "success" : "warning"}
                    >
                      {item.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {relativeTime(item.occurredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          [
            "Reward value in this ledger",
            peso(rewardValue),
            `${approved.length} approved redemption${approved.length === 1 ? "" : "s"}`,
          ],
          [
            "Approval rate",
            `${approvalRate.toFixed(1)}%`,
            `${reversals} reversal${reversals === 1 ? "" : "s"}`,
          ],
          [
            "Outstanding stamp-card liability",
            peso(stampLiability),
            "What unredeemed stamps would cost",
          ],
        ].map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">{detail}</p>
          </article>
        ))}
      </div>
    </ViewFrame>
  );
}

/** Per-campaign delivery ceiling quoted in the preflight copy. */
const SMS_CEILING = 1000;

/**
 * What is left of this month's plan allowance, per channel.
 *
 * Email was billed at the overage rate from the first message while its own
 * label read "Uses allowance". A channel with allowance left costs nothing
 * until that allowance runs out.
 */
const allowanceRemaining: Record<string, number> = Object.fromEntries(
  business.billing.allowances
    .filter((item) => item.unit === "messages" || item.unit === "credits")
    .map((item) => [
      item.label === "SMS credits" ? "SMS" : item.label,
      Math.max(0, item.included - item.used),
    ]),
);

/** Cost of sending to `count` recipients on one channel, allowance first. */
function channelCost(name: string, unit: number, count: number) {
  if (unit === 0) return 0;
  const free = Math.min(count, allowanceRemaining[name] ?? 0);
  return (count - free) * unit;
}

type ChannelStatus = "ready" | "planned";

const channelConfig: {
  name: string;
  icon: typeof BellRing;
  eligible: number;
  unit: number;
  note: string;
  status: ChannelStatus;
}[] = [
  {
    name: "In-app",
    icon: MessageSquareText,
    eligible: 1280,
    unit: 0,
    note: "Included",
    status: "ready",
  },
  {
    name: "Push",
    icon: BellRing,
    eligible: 1120,
    unit: 0,
    note: "Included",
    status: "ready",
  },
  {
    name: "Email",
    icon: Mail,
    eligible: 1060,
    unit: 0.025,
    note: "₱0.025 / email",
    status: "ready",
  },
  {
    name: "Viber",
    icon: MessageCircle,
    eligible: 610,
    unit: 0.42,
    note: "₱0.42 / message",
    status: "ready",
  },
  {
    name: "SMS",
    icon: Phone,
    eligible: 780,
    unit: 0.95,
    note: "₱0.95 / segment",
    status: "ready",
  },
  {
    name: "WhatsApp",
    icon: Send,
    eligible: 240,
    unit: 0.55,
    note: "Needs Meta Business verification",
    status: "planned",
  },
  {
    name: "Messenger",
    icon: MessagesSquare,
    eligible: 430,
    unit: 0.35,
    note: "Needs Meta Business verification",
    status: "planned",
  },
];

function CampaignsView({ notify }: { notify: Notify }) {
  const { scheduleCampaign, campaigns } = useDemoState();
  const [campaignName, setCampaignName] = useState("Tuesday treat");
  const [audience, setAudience] = useState(1280);
  // These three were uncontrolled selects, so the composer showed choices that
  // never reached the scheduled campaign.
  const [audienceSegment, setAudienceSegment] = useState("Almost regulars");
  const [sendTime, setSendTime] = useState("Tuesday, 1:30 PM");
  const [frequencyPolicy, setFrequencyPolicy] = useState("Respect 2 promos / week");
  const [channels, setChannels] = useState<Record<string, boolean>>({
    "In-app": true,
    Push: true,
    Email: true,
    Viber: false,
    SMS: false,
  });
  const [smartRouting, setSmartRouting] = useState(true);
  const [message, setMessage] = useState(
    "A warm pastry is waiting. Visit Sweet Crumbs before 4 PM this Tuesday and your next stamp counts twice.",
  );
  const selectedChannels = channelConfig.filter(
    (channel) => channel.status === "ready" && channels[channel.name],
  );
  const smsChannel = channelConfig.find((channel) => channel.name === "SMS");
  const viberChannel = channelConfig.find((channel) => channel.name === "Viber");
  // ponytail: routing only ever diverts SMS to the cheaper messaging app. One
  // subtraction beats modelling a full per-recipient channel waterfall.
  const smsAudience =
    smsChannel && channels.SMS ? Math.min(audience, smsChannel.eligible) : 0;
  const divertedToViber =
    smartRouting && viberChannel ? Math.min(smsAudience, viberChannel.eligible) : 0;
  const routingSavings =
    smsChannel && viberChannel
      ? divertedToViber * (smsChannel.unit - viberChannel.unit)
      : 0;
  const deliveryCost = Math.max(
    0,
    selectedChannels.reduce(
      (sum, channel) =>
        sum + channelCost(channel.name, channel.unit, Math.min(audience, channel.eligible)),
      0,
    ) - routingSavings,
  );
  const reachable = Math.min(
    audience,
    Math.max(...selectedChannels.map((channel) => channel.eligible), 0),
  );
  const predictedVisits = Math.round(reachable * 0.118);
  // deliveryCost is pesos, from the published channel rates in plans.ts; the
  // API sends the average order in centavos. Both are named for their unit
  // because dividing one by the other silently put the ROI out by 100x.
  const predictedRevenuePesos = (predictedVisits * business.metrics.averageOrderCentavos) / 100;
  const roi = deliveryCost ? predictedRevenuePesos / deliveryCost : predictedRevenuePesos;
  return (
    <ViewFrame
      eyebrow="Campaign studio"
      title="Campaigns"
      description="Plan across in-app, push, email, Viber, and SMS with consent eligibility, delivery cost, quiet hours, and expected business value visible before launch. Messaging apps are used ahead of SMS whenever a customer is reachable there."
      action={
        <Button
          tone="quiet"
          icon={<ClipboardCheck size={16} />}
          onClick={() => {
            const problems: string[] = [];
            if (selectedChannels.length === 0) {
              problems.push("no channel selected");
            }
            if (!message.trim()) problems.push("the message is empty");
            if (message.length > 320) problems.push("the message is over 320 characters");
            if (channels.SMS && deliveryCost > SMS_CEILING) {
              problems.push(
                `estimated cost ${peso(deliveryCost, { decimals: true })} is over the ${peso(SMS_CEILING)} campaign ceiling`,
              );
            }
            if (reachable === 0) problems.push("no reachable customers with consent");
            notify(
              problems.length
                ? `Preflight failed: ${problems.join("; ")}.`
                : `Preflight passed: ${reachable.toLocaleString()} reachable, estimated ${peso(deliveryCost, { decimals: true })}.`,
              problems.length ? "error" : "info",
            );
          }}
        >
          Run preflight
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Campaign name
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Audience
              <select
                value={audienceSegment}
                onChange={(event) => setAudienceSegment(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Almost regulars</option>
                <option>At-risk regulars</option>
                <option>One action from reward</option>
                <option>Custom segment</option>
              </select>
            </label>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="audience-size" className="text-xs font-bold">
                Audience size
              </label>
              <span className="text-sm font-extrabold">
                {audience.toLocaleString()}
              </span>
            </div>
            <input
              id="audience-size"
              type="range"
              min="100"
              max="2000"
              step="20"
              value={audience}
              onChange={(event) => setAudience(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--accent-strong)]"
            />
          </div>
          <div className="mt-6">
            <p className="text-xs font-bold">Channels</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {channelConfig.map((channel) => {
                const Icon = channel.icon;
                const planned = channel.status === "planned";
                const active = !planned && channels[channel.name];
                return (
                  <button
                    type="button"
                    key={channel.name}
                    aria-pressed={planned ? undefined : active}
                    disabled={planned}
                    title={planned ? "Available after Meta Business verification" : undefined}
                    onClick={() =>
                      setChannels((current) => ({
                        ...current,
                        [channel.name]: !active,
                      }))
                    }
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${planned ? "cursor-not-allowed border-dashed border-[var(--line-strong)] bg-[var(--surface)] opacity-70" : active ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${active ? "bg-white/10 text-[var(--accent)]" : "bg-[var(--surface)]"}`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold">{channel.name}</span>
                        {planned && (
                          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                            Soon
                          </span>
                        )}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] ${active ? "text-white/60" : "text-[var(--muted)]"}`}
                      >
                        {channel.eligible.toLocaleString()} reachable ·{" "}
                        {allowanceRemaining[channel.name]
                          ? `${allowanceRemaining[channel.name].toLocaleString()} left in plan, then ${channel.note.toLowerCase()}`
                          : channel.note}
                      </span>
                    </span>
                    {active && <Check size={16} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={smartRouting}
              onClick={() => setSmartRouting((value) => !value)}
              className={`mt-3 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${smartRouting ? "border-[var(--success)] bg-[rgb(15_118_85/7%)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${smartRouting ? "bg-[var(--success)] text-white" : "bg-[var(--surface)]"}`}
              >
                <Route size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  Reach on a messaging app before SMS
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  {channels.SMS
                    ? divertedToViber > 0
                      ? `${divertedToViber.toLocaleString()} of ${smsAudience.toLocaleString()} SMS recipients are reachable on Viber, saving ₱${routingSavings.toFixed(2)} on this send.`
                      : "No selected recipients are reachable on a messaging app right now."
                    : "Turn on SMS to see how many recipients can be reached more cheaply."}
                </span>
              </span>
              <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                {smartRouting ? "On" : "Off"}
              </span>
            </button>
          </div>
          <label className="mt-6 grid gap-2 text-xs font-bold">
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              maxLength={320}
              className="rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] p-4 text-sm leading-relaxed outline-none focus:border-[var(--accent-strong)]"
            />
            <span className="text-right text-[10px] font-semibold text-[var(--muted)]">
              {message.length}/320 · SMS may use {message.length > 160 ? 2 : 1}{" "}
              segment{message.length > 160 ? "s" : ""}
            </span>
          </label>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Send time
              <select
                value={sendTime}
                onChange={(event) => setSendTime(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Tuesday, 1:30 PM</option>
                <option>Now after preflight</option>
                <option>At each customer’s usual time</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Frequency policy
              <select
                value={frequencyPolicy}
                onChange={(event) => setFrequencyPolicy(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Respect 2 promos / week</option>
                <option>Service message only</option>
              </select>
            </label>
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Campaign economics</Eyebrow>
            <CircleDollarSign size={20} />
          </div>
          <div className="mt-7 divide-y divide-[rgb(24_18_12/16%)] border-y border-[rgb(24_18_12/16%)]">
            {[
              ["Reachable with consent", reachable.toLocaleString()],
              ["Estimated delivery cost", peso(deliveryCost, { decimals: true })],
              ["Predicted visits", predictedVisits],
              [
                "Predicted visit revenue",
                peso(predictedRevenuePesos),
              ],
              [
                "Revenue / delivery cost",
                deliveryCost ? `${roi.toFixed(1)}×` : "No paid channel",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="text-[var(--ink)]/75">{label}</span>
                <span className="font-extrabold">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--surface)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--success)]"
              />
              <div>
                <p className="text-xs font-extrabold">Preflight guardrails</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  Purpose and consent checked per channel. Quiet hours,
                  complaint threshold, duplicate suppression, and a ₱1,000 SMS
                  ceiling apply.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              onClick={() => notify("Test message preview opened.", "review")}
            >
              Send test
            </Button>
            <Button
              onClick={() => {
                if (selectedChannels.length === 0) {
                  notify("Choose at least one channel before scheduling.", "error");
                  return;
                }
                scheduleCampaign({
                  name: campaignName.trim() || "Untitled campaign",
                  audience: `${audienceSegment} · ${audience.toLocaleString()} selected`,
                  channels: selectedChannels.map((channel) => channel.name),
                  sent: reachable,
                  visited: 0,
                  revenueCentavos: 0,
                  costCentavos: Math.round(deliveryCost * 100),
                  status: "Scheduled",
                  sendTime,
                  frequencyPolicy,
                });
                notify(
                  `${campaignName.trim() || "Untitled campaign"} scheduled for ${sendTime.toLowerCase()} · ${reachable.toLocaleString()} reachable customers.`,
                );
              }}
              icon={<Send size={15} />}
            >
              Schedule
            </Button>
          </div>
        </aside>
      </div>
      <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
          <div>
            <Eyebrow>Campaign history</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Revenue after delivery</h2>
          </div>
          <button
            type="button"
            onClick={() => notify("Campaign history opened.", "review")}
            className="text-xs font-bold text-[var(--accent-strong)]"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-extrabold">{campaign.name}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {campaign.audience}
                      {campaign.sendTime ? ` · ${campaign.sendTime}` : ""}
                      {campaign.frequencyPolicy ? ` · ${campaign.frequencyPolicy}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {campaign.channels.join(" + ")}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {campaign.sent.toLocaleString()} sent
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {campaign.visited} visits
                  </td>
                  <td className="px-4 py-4 text-sm font-extrabold">
                    {pesoFromCentavos(campaign.revenueCentavos)}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={
                        campaign.status === "Completed" ? "success" : "warning"
                      }
                    >
                      {campaign.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ViewFrame>
  );
}

/** Derived so a channel that exists in the ledger is always filterable. */
const messageChannels = [
  "All",
  ...Array.from(new Set(business.messages.map((message) => message.channel))),
];

function MessageLogView({ notify }: { notify: Notify }) {
  const [channel, setChannel] = useState("All");
  const [query, setQuery] = useState("");
  const rows = business.messages.filter(
    (message) =>
      (channel === "All" || message.channel === channel) &&
      `${message.campaign} ${message.customer} ${message.status}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <ViewFrame
      eyebrow="Delivery ledger"
      title="Message log"
      description="Inspect every customer communication across in-app, push, email, and SMS—including cost, consent outcomes, and downstream visits."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          onClick={() => notify("Message ledger exported.")}
        >
          Export log
        </Button>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {messageChannels.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setChannel(item)}
                className={`rounded-full px-3 py-2 text-xs font-bold ${channel === item ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--paper)] text-[var(--muted-strong)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search message history"
              className="bg-transparent text-sm outline-none"
              placeholder="Search messages"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((message) => (
                <tr
                  key={message.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4 text-sm font-extrabold">
                    {message.campaign}
                  </td>
                  <td className="px-4 py-4 text-sm">{message.customer}</td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {message.channel}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={
                        message.status === "Opted out" ? "warning" : "success"
                      }
                    >
                      {message.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {message.costCentavos ? pesoFromCentavos(message.costCentavos) : "Included"}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {message.sentAt}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-bold text-[var(--muted)]"
                  >
                    No messages match this channel and search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ViewFrame>
  );
}

function AnalyticsView() {
  // "Campaign-attributed" was hardcoded at ₱76.4k while the fixture's own
  // campaign revenue summed to ₱136.3k. Both now come from the same number.
  const metrics = business.metrics;
  const rewardIssued = business.programs.reduce(
    (sum, program) => sum + program.liabilityCentavos,
    0,
  );
  const retention = [100, 68, 54, 47, 44, 42];
  const cohorts = [
    [100, 71, 58, 49, 45, 43],
    [100, 69, 55, 48, 44, 0],
    [100, 74, 61, 53, 0, 0],
    [100, 78, 66, 0, 0, 0],
  ];
  return (
    <ViewFrame
      eyebrow="Retention intelligence"
      title="Analytics"
      description="Measure the return visit, not vanity reach. Connect program behavior, campaign cost, reward liability, and member revenue."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Six-week retention</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Customers who return</h2>
            </div>
            <Pill tone="success">+7.4% vs prior</Pill>
          </div>
          <div className="mt-10 flex h-64 items-end gap-3">
            {retention.map((value, index) => (
              <div
                key={index}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <span className="mb-2 text-center text-xs font-extrabold">
                  {value}%
                </span>
                <div
                  className={`rounded-t-xl ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                  style={{ height: `${value}%` }}
                />
                <span className="mt-2 text-center text-[10px] text-[var(--muted)]">
                  W{index}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Member economics</Eyebrow>
          <p className="mt-7 text-4xl font-extrabold tracking-[-0.03em]">
            {pesoCompactFromCentavos(metrics.memberRevenueCentavos)}
          </p>
          <p className="mt-1 text-xs text-white/55">
            member-attributed revenue this month
          </p>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              ["Campaign-attributed", pesoCompactFromCentavos(metrics.campaignRevenueCentavos)],
              ["Outstanding reward liability", pesoCompactFromCentavos(rewardIssued)],
              [
                "Revenue / reward liability",
                `${(metrics.memberRevenueCentavos / rewardIssued).toFixed(1)}×`,
              ],
              ["Average member order", pesoFromCentavos(metrics.averageOrderCentavos)],
              ["Repeat visit rate", `${metrics.repeatRate}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="text-white/55">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex items-end justify-between">
          <div>
            <Eyebrow>Cohort return matrix</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              First visit month → weeks retained
            </h2>
          </div>
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            Darker cells mean more customers returned.
          </p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[660px]">
            <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-1 text-center text-[10px] font-bold text-[var(--muted)]">
              <span />
              <span>W0</span>
              <span>W1</span>
              <span>W2</span>
              <span>W3</span>
              <span>W4</span>
              <span>W5</span>
            </div>
            {cohorts.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="mt-1 grid grid-cols-[120px_repeat(6,1fr)] gap-1"
              >
                <span className="flex items-center text-xs font-bold">
                  {["May", "June", "July", "August"][rowIndex]} 2026
                </span>
                {row.map((value, colIndex) => (
                  <span
                    key={colIndex}
                    className="grid min-h-12 place-items-center rounded-lg text-xs font-extrabold"
                    style={{
                      backgroundColor: value
                        ? `rgb(232 163 61 / ${0.12 + value / 130})`
                        : "var(--surface-2)",
                      color: value > 55 ? "var(--ink)" : "var(--muted-strong)",
                    }}
                  >
                    {value ? `${value}%` : "—"}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </ViewFrame>
  );
}

const STAFF_ROLES = [
  ["Owner", "Everything, including billing and deletion"],
  ["Manager", "Programs, customers, campaigns, and staff"],
  ["Cashier", "Scan, earn, redeem, and reverse window"],
  ["Analyst", "Read-only customers and analytics"],
] as const;

function StaffView({ notify }: { notify: Notify }) {
  // "Invite staff" used to open /accept-invite — the recipient's screen. An
  // owner needs a composer, so this is one.
  const { staff, inviteStaff } = useDemoState();
  const [composerOpen, setComposerOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("Cashier");
  const [inviteLocation, setInviteLocation] = useState(business.locations[0].name);

  function sendInvite() {
    if (!inviteName.trim()) {
      notify("Add the name the invitation should be addressed to.", "error");
      return;
    }
    inviteStaff({ name: inviteName.trim(), role: inviteRole, location: inviteLocation });
    notify(
      `Invitation prepared for ${inviteName.trim()} as ${inviteRole} at ${inviteLocation}.`,
    );
    setInviteName("");
    setComposerOpen(false);
  }

  return (
    <ViewFrame
      eyebrow="People & permissions"
      title="Staff access"
      description="Give each person only the counter, customer, campaign, analytics, or configuration actions their role needs."
      action={
        <Button
          icon={<UserPlus size={16} />}
          aria-expanded={composerOpen}
          aria-controls="staff-invite"
          onClick={() => setComposerOpen((open) => !open)}
        >
          Invite staff
        </Button>
      }
    >
      {composerOpen && (
        <section
          id="staff-invite"
          className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <Eyebrow>New invitation</Eyebrow>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-xs font-bold">
              Name
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Who are you inviting?"
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Role
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                {STAFF_ROLES.map(([role]) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Location
              <select
                value={inviteLocation}
                onChange={(event) => setInviteLocation(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                {business.locations.map((location) => (
                  <option key={location.id}>{location.name}</option>
                ))}
                <option>All locations</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-strong)]">
            {STAFF_ROLES.find(([role]) => role === inviteRole)?.[1]}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={<Send size={15} />} onClick={sendInvite}>
              Send invitation
            </Button>
            <Button tone="quiet" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
            No email leaves the browser. The invited person would open{" "}
            <code className="font-mono">/accept-invite</code> to review the role
            before joining.
          </p>
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-3">Person</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr
                  key={person.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                        {person.initials}
                      </span>
                      <span className="text-sm font-extrabold">{person.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={person.role === "Owner" ? "warning" : "neutral"}
                    >
                      {person.role}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 text-xs">{person.location}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {relativeTime(person.lastActiveAt)}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={person.status === "Active" ? "success" : "warning"}
                    >
                      {person.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      aria-label={`Edit ${person.name} access`}
                      onClick={() =>
                        notify(`${person.name} access editor opened.`, "review")
                      }
                      className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-2)]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAFF_ROLES.map(([role, detail]) => (
          <article
            key={role}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm font-extrabold">{role}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
              {detail}
            </p>
          </article>
        ))}
      </div>
    </ViewFrame>
  );
}

/** Preferences that write through `setSetting`, which previously had no
 *  callers at all. */
const BILLING_PREFERENCES = [
  [
    "autoTopUpSms",
    "Top up SMS credits automatically",
    "Buy 500 more whenever the balance drops under 200",
  ],
  [
    "invoiceEmails",
    "Email invoices to the owner",
    `Sent to ${business.profile.owner}`,
  ],
] as const;

function SettingsView({ notify }: { notify: Notify }) {
  const {
    integrations: connected,
    toggleIntegration,
    settings,
    setSetting,
  } = useDemoState();
  const billing = business.billing;
  return (
    <ViewFrame
      eyebrow="Workspace settings"
      title="Channels & billing"
      description="Manage messaging providers, wallet passes, data controls, and the channel budget that protects your monthly spend. POS and API setup now lives in Integrations."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Channels & services</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              Connect the tools you already use
            </h2>
          </div>
          <div className="grid sm:grid-cols-2">
            {business.integrations
              .filter((integration) => integration.id !== "int_pos")
              .map((integration, index) => {
              const isConnected = connected[integration.id];
              // Planned integrations are blocked on an external approval, so the
              // switch stays inert rather than pretending it can be turned on.
              const isPlanned = integration.status === "Planned";
              return (
                <article
                  key={integration.id}
                  className={`p-5 ${index > 1 ? "border-t border-[var(--line)]" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-[var(--line)]" : ""} ${index === 1 ? "border-t border-[var(--line)] sm:border-t-0" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                      <PlugZap size={17} />
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-label={`Toggle ${integration.name}`}
                      aria-checked={isConnected}
                      disabled={isPlanned}
                      title={isPlanned ? "Not available yet" : undefined}
                      onClick={() => {
                        const next = toggleIntegration(integration.id);
                        notify(
                          `${integration.name} ${next ? "connected" : "disconnected"} in this demo.`,
                        );
                      }}
                      className={`relative h-6 w-10 shrink-0 rounded-full before:absolute before:-inset-y-2.5 before:-inset-x-2 before:content-[''] ${isPlanned ? "cursor-not-allowed bg-[var(--line)] opacity-60" : isConnected ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                    >
                      <span
                        className={`absolute top-1 size-4 rounded-full bg-white transition ${isConnected ? "left-5" : "left-1"}`}
                      />
                    </button>
                  </div>
                  <p className="mt-6 text-sm font-extrabold">{integration.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                    {integration.category}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {integration.detail}
                  </p>
                </article>
              );
              })}
          </div>
        </section>
        <aside className="space-y-3">
          <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
            <div className="flex items-center justify-between">
              <Eyebrow>Current plan</Eyebrow>
              <Pill tone="success">Active</Pill>
            </div>
            <p className="mt-7 text-3xl font-extrabold">
              {billing.plan} · {peso(billing.monthlyCentavos)}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {billing.cycle} billing · renews {longDate(business.profile.renewalOn)}
            </p>
            <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
              {billing.allowances.map((item) => {
                const pct = Math.min(100, Math.round((item.used / item.included) * 100));
                return (
                  <div key={item.label} className="py-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/55">{item.label}</span>
                      <strong>
                        {item.used.toLocaleString()} / {item.included.toLocaleString()}
                      </strong>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/12">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-white/55">
              Plus {billing.smsCreditBalance.toLocaleString()} prepaid SMS credits.
              Credits are bought separately from the monthly allowance and do not
              expire.
            </p>
            <Button
              tone="accent"
              className="mt-5"
              onClick={() => notify("Plan comparison opened.", "review")}
            >
              Manage plan
            </Button>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Billing</Eyebrow>
              <CreditCard size={18} className="text-[var(--accent-strong)]" />
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--paper)] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                <CreditCard size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">
                  {billing.method.brand} ending {billing.method.last4}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Expires {billing.method.expiry} · next charge {longDate(billing.nextInvoiceOn)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => notify("Payment method editor opened.", "review")}
                className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]"
              >
                Update
              </button>
            </div>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {billing.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{invoice.period}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      Issued {longDate(invoice.issuedOn)}
                    </p>
                  </div>
                  <span className="text-xs font-bold">{peso(invoice.amountCentavos)}</span>
                  <Pill tone="success">{invoice.status}</Pill>
                  <button
                    type="button"
                    aria-label={`Download the ${invoice.period} invoice`}
                    onClick={() => notify(`${invoice.period} invoice prepared.`)}
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-[var(--surface-2)]"
                  >
                    <Download size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1">
              {BILLING_PREFERENCES.map(([key, label, detail]) => (
                <div key={key} className="flex items-start gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{label}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted)]">
                      {detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(settings[key])}
                    aria-label={label}
                    onClick={() => {
                      setSetting(key, !settings[key]);
                      notify(`${label} ${settings[key] ? "turned off" : "turned on"}.`);
                    }}
                    className={`relative h-6 w-10 shrink-0 rounded-full ${settings[key] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white transition ${settings[key] ? "left-5" : "left-1"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 text-[var(--accent-strong)]"
              />
              <div>
                <p className="text-sm font-extrabold">Privacy defaults</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  Purpose labels, consent evidence, retention, data export,
                  correction, and deletion workflows are specified for the
                  production service. None are connected in this demo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => notify("Privacy and retention settings opened.", "review")}
              className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--accent-strong)]"
            >
              Review controls <ArrowRight size={14} />
            </button>
          </article>
        </aside>
      </div>
    </ViewFrame>
  );
}

export function BusinessViewContent({
  view,
  notify,
  onNavigate,
}: {
  view: BusinessView;
  notify: Notify;
  onNavigate: (view: BusinessView) => void;
}) {
  const views: Record<Exclude<BusinessView, "dashboard">, ReactNode> = {
    scan: <ScanView notify={notify} />,
    "join-code": <JoinCodeView notify={notify} />,
    customers: <CustomersView notify={notify} />,
    business: <BusinessProfileView notify={notify} />,
    programs: <ProgramsView notify={notify} />,
    "favorite-orders": <FavoriteOrdersView notify={notify} />,
    birthday: <BirthdayView notify={notify} />,
    redemptions: <RedemptionsView notify={notify} />,
    campaigns: <CampaignsView notify={notify} />,
    "message-log": <MessageLogView notify={notify} />,
    analytics: <AnalyticsView />,
    integrations: (
      <IntegrationsView notify={notify} onNavigate={onNavigate} />
    ),
    staff: <StaffView notify={notify} />,
    settings: <SettingsView notify={notify} />,
  };
  return view === "dashboard" ? null : views[view];
}
