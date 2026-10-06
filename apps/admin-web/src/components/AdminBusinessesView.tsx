"use client";

import { useState } from "react";
import {
  EMPTY_PLATFORM_METRICS,
  endSupportAccess,
  isMissingEndpoint,
  isPreview,
  keys,
  moveTenantPlan,
  openSupportAccess,
  setTenantGrace,
  setTenantManagers,
  useAddOns,
  useAdministrators,
  useApiMutation,
  useOnboarding,
  usePlatformMetrics,
  useSession,
  useTenants,
  type AddOnSubscription,
  type PlanName,
  type Tenant,
  type TenantRisk,
} from "@kypstamping/api";
import { Button, buttonClass, Eyebrow, Pill, PreviewBadge, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { Checkbox, Chip, FormMessage, Input, Select } from "@kypstamping/ui/form";
import { longDate, pesoFromCentavos, relativeTime, timeOfDay } from "@kypstamping/ui/format";
import { Building2, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { useAdminState } from "@/components/AdminState";
import { ADD_ONS, merchantIdOf } from "@/lib/catalog";

const PLANS: PlanName[] = ["Launch", "Core", "Grow", "Scale"];
const RISKS: TenantRisk[] = ["Healthy", "Watch", "At risk"];
/** Where support access opens: the business portal shares the API cookie, so
 *  a new tab there lands inside the shop with no second sign-in. */
const BUSINESS_APP_URL = process.env.NEXT_PUBLIC_BUSINESS_APP_URL ?? "https://biz.kyprewards.com";
const SUPPORT_MINUTES = [30, 60, 120] as const;

function riskTone(risk: TenantRisk) {
  return risk === "Healthy" ? "success" : risk === "Watch" ? "warning" : "danger";
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | "All";
  onChange: (next: T | "All") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </span>
      {(["All", ...options] as const).map((option) => (
        <Chip key={option} pressed={value === option} onClick={() => onChange(option as T | "All")}>
          {option}
        </Chip>
      ))}
    </div>
  );
}

export function AdminBusinessesView() {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // An account manager sees only the shops assigned to them, and the
  // network-wide reads (metrics, add-ons, onboarding) answer 403 - so they
  // are not asked for.
  const { data: session } = useSession();
  const isAdmin = session?.platformRole === "admin";
  // Refetched on focus, against the package default: support access is
  // ended from the business portal in another tab, and the drawer here must
  // not keep offering a workspace that has already closed.
  const { data: tenants = [], isPending, error, refetch } = useTenants({ refetchOnWindowFocus: true });
  const { data: metrics = EMPTY_PLATFORM_METRICS } = usePlatformMetrics({ enabled: isAdmin });
  const { data: addOns = [], error: addOnsError } = useAddOns({ enabled: isAdmin });
  const { focusTenantId, setFocusTenantId } = useAdminState();
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<PlanName | "All">("All");
  const [risk, setRisk] = useState<TenantRisk | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = tenants.filter(
    (business) =>
      (business.name.toLowerCase().includes(query.toLowerCase()) ||
        business.city.toLowerCase().includes(query.toLowerCase())) &&
      (plan === "All" || business.plan === plan) &&
      (risk === "All" || business.risk === risk),
  );
  // Another view (an approved application) may have asked for a workspace.
  const focused = focusTenantId
    ? tenants.find(
        (t) =>
          merchantIdOf(t) === focusTenantId ||
          t.businessId === focusTenantId ||
          t.id === focusTenantId,
      )
    : undefined;
  const selected =
    tenants.find((business) => business.id === selectedId) ?? focused ?? filtered[0] ?? tenants[0];
  const founding = tenants.filter((t) => t.founding).length;

  function choose(business: Tenant) {
    setSelectedId(business.id);
    setFocusTenantId(null);
  }

  return (
    <ViewFrame
      wide
      className="admin-canvas"
      eyebrow="Tenant directory"
      title="Businesses"
      description={
        isAdmin
          ? `Tenant health, plan, founding status, member growth and risk, without crossing the customer-data boundary. Showing ${tenants.length} of ${metrics.liveBusinesses} live tenants; ${founding} founding.`
          : `The ${tenants.length} ${tenants.length === 1 ? "business" : "businesses"} assigned to you. Open support access to set one up; every change is written to its audit ledger under your name.`
      }
      action={
        isAdmin ? (
          <Button
            icon={<Building2 size={16} />}
            aria-expanded={onboardingOpen}
            onClick={() => setOnboardingOpen((open) => !open)}
          >
            {onboardingOpen ? "Hide onboarding" : "Onboarding progress"}
          </Button>
        ) : undefined
      }
    >
      {onboardingOpen && <OnboardingPanel />}
      <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="tenants" rows={5}>
        {focusTenantId && !focused && (
          <p className="mb-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-4 text-xs text-[var(--muted-strong)]">
            The workspace <code className="font-mono">{focusTenantId}</code> is not in this tenant
            list yet. It appears once the API lists it.
          </p>
        )}
        {!selected ? (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted-strong)]">
            {isAdmin
              ? "No tenants yet. Approving an application creates the first one."
              : "No business is assigned to you yet. An administrator assigns them from each tenant's record."}
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
              <div className="space-y-3 border-b border-[var(--line)] p-4">
                <Input
                  type="search"
                  icon={<Search size={16} />}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Business or city"
                  aria-label="Search businesses by name or city"
                />
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Chips label="Plan" options={PLANS} value={plan} onChange={setPlan} />
                  <Chips label="Risk" options={RISKS} value={risk} onChange={setRisk} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {["Business", "Plan", "Founding", "Featured", "Members", "MRR", "Health", "Risk"].map(
                        (column) => (
                          <th key={column} scope="col" className="px-4 py-3 first:px-5">
                            {column}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((business) => (
                      <tr
                        key={business.id}
                        tabIndex={0}
                        aria-label={`Open ${business.name}`}
                        aria-selected={selected.id === business.id}
                        onClick={() => choose(business)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            choose(business);
                          }
                        }}
                        className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--accent-strong)] last:border-0 ${selected.id === business.id ? "bg-[rgb(232_163_61/9%)]" : "hover:bg-[var(--paper)]"}`}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold">{business.name}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                            {business.owner} · {business.city}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <Pill tone={business.plan === "Launch" ? "neutral" : "warning"}>
                            {business.plan}
                          </Pill>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold">
                          {business.founding ? (
                            <Pill tone="success">Founding</Pill>
                          ) : (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold">
                          {business.featured ? (
                            <Pill tone="warning">Featured</Pill>
                          ) : (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold">
                          {business.members.toLocaleString("en-PH")}
                        </td>
                        <td className="px-4 py-4 text-sm font-extrabold">
                          {pesoFromCentavos(business.mrrCentavos)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]"
                              aria-hidden="true"
                            >
                              <div
                                className={`h-full rounded-full ${business.health >= 80 ? "bg-[var(--success)]" : business.health >= 65 ? "bg-[var(--accent)]" : "bg-[var(--danger)]"}`}
                                style={{ width: `${business.health}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{business.health}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Pill tone={riskTone(business.risk)}>{business.risk}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="p-8 text-center text-xs font-semibold text-[var(--muted)]">
                    No tenant matches these filters.
                  </p>
                )}
              </div>
              <p className="border-t border-[var(--line)] px-5 py-3 text-[10px] font-semibold text-[var(--muted)]">
                Showing {filtered.length} of {tenants.length} businesses.
              </p>
            </section>
            <TenantDrawer
              key={selected.id}
              tenant={selected}
              isAdmin={isAdmin}
              addOns={addOns.filter((a) => a.merchantId === merchantIdOf(selected))}
              addOnsUnavailable={
                addOnsError
                  ? isMissingEndpoint(addOnsError)
                    ? "The API does not list add-ons yet."
                    : addOnsError.message
                  : null
              }
            />
          </div>
        )}
      </QueryBoundary>
    </ViewFrame>
  );
}

function TenantDrawer({
  tenant,
  isAdmin,
  addOns,
  addOnsUnavailable,
}: {
  tenant: Tenant;
  isAdmin: boolean;
  addOns: AddOnSubscription[];
  addOnsUnavailable: string | null;
}) {
  const [target, setTarget] = useState<PlanName>(tenant.plan);
  const [outcome, setOutcome] = useState<{ tone: "ok" | "refused"; text: string } | null>(null);
  // While the paid tiers are closed, a move onto one is a comp: the API puts
  // the shop there free and never invoices it.
  const { flags } = useAdminState();
  const comp = !flags["billing.paid_tiers"] && target !== "Launch";
  const move = useApiMutation(
    (plan: PlanName) => moveTenantPlan(tenant.businessId ?? "", plan),
    { invalidates: [keys.admin.tenants(), keys.admin.audit()] },
  );
  return (
    <aside
      className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]"
      aria-label={`${tenant.name} record`}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-lg font-extrabold text-[var(--ink)]">
          {tenant.name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </span>
        <Pill tone={riskTone(tenant.risk)}>{tenant.risk}</Pill>
      </div>
      <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.02em]">{tenant.name}</h2>
      <p className="mt-1 text-sm text-white/60">
        {tenant.owner} · {tenant.city}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
        {[
          ["Plan", tenant.plan],
          ["MRR", pesoFromCentavos(tenant.mrrCentavos)],
          ["Members", tenant.members.toLocaleString("en-PH")],
          ["Joined", longDate(tenant.joinedOn)],
          [
            "Founding",
            tenant.founding ? "Yes · Core free for three months when it opens" : "Not recorded",
          ],
          ["Featured in Discover", tenant.featured ? "Yes" : "No"],
          [
            "Payment grace",
            tenant.graceUntil ? `Until ${longDate(tenant.graceUntil)}` : "Standard seven days",
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-[var(--ink-soft)] p-4">
            <p className="text-[10px] text-white/50">{label}</p>
            <p className="mt-1 text-sm font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Eyebrow>Plan history</Eyebrow>
        <ol className="mt-2 divide-y divide-white/12 border-y border-white/12 text-xs">
          <li className="flex justify-between py-2.5">
            <span>{tenant.plan} since joining</span>
            <span className="text-white/50">{longDate(tenant.joinedOn)}</span>
          </li>
        </ol>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">
          Every move is written to the audit ledger; the API keeps only the current plan here.
        </p>
      </div>

      <SupportAccessCard tenant={tenant} />
      {isAdmin && <ManagersCard tenant={tenant} />}

      {isAdmin && (
      <div className="mt-5">
        <Eyebrow>Move plan</Eyebrow>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">
          The same rules as the billing screen merchants see: a downgrade that would strand a
          live program is refused by name. While the paid tiers are closed, moving a shop onto
          one is a comp: free, never invoiced, and recorded as a comp in the audit ledger. A comp
          stays free until an administrator moves the shop again; a founding merchant&apos;s
          three free months of Core are not used by it.
        </p>
        <div className="mt-3 flex gap-2">
          <Select
            surface="dark"
            aria-label="Plan to move this tenant to"
            value={target}
            onChange={(event) => setTarget(event.target.value as PlanName)}
            className="flex-1"
          >
            {PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </Select>
          <Button
            tone="accent"
            size="lg"
            disabled={!tenant.businessId || target === tenant.plan || move.isPending}
            onClick={() =>
              move.mutate(target, {
                onSuccess: (saved) =>
                  setOutcome({
                    tone: "ok",
                    text: comp
                      ? `Comped onto ${saved.plan}: free, no invoice.`
                      : `Moved to ${saved.plan}.`,
                  }),
                onError: (failure) => setOutcome({ tone: "refused", text: failure.message }),
              })
            }
          >
            {move.isPending ? (comp ? "Comping…" : "Moving…") : comp ? `Comp ${target}` : "Move"}
          </Button>
        </div>
        <FormMessage surface="dark" tone={outcome?.tone === "refused" ? "error" : "success"} className="mt-2">
          {outcome?.text}
        </FormMessage>
      </div>
      )}

      {isAdmin && <GraceCard tenant={tenant} />}

      {isAdmin && (
      <div className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>Add-ons</Eyebrow>
          {isPreview(addOns) && <PreviewBadge />}
        </div>
        {addOnsUnavailable ? (
          <p className="mt-2 text-xs text-white/55">{addOnsUnavailable}</p>
        ) : addOns.length === 0 ? (
          <p className="mt-2 text-xs text-white/55">No add-ons on this workspace.</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/12 border-y border-white/12 text-xs">
            {addOns.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  {ADD_ONS.find((a) => a.key === item.addOn)?.name ?? item.addOn}
                  <span className="ml-2 text-white/50">{item.status}</span>
                </span>
                <span className="text-right">
                  <span className="block font-extrabold">
                    {item.priceCentavos === 0 ? "Free" : pesoFromCentavos(item.priceCentavos)}
                  </span>
                  {item.renewsOn && (
                    <span className="text-[10px] text-white/50">
                      renews {longDate(item.renewsOn)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      <div className="mt-6 rounded-2xl border border-white/12 p-4">
        <div className="flex gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-white/65">
            Support access is time-limited, reason-bound and written to the audit ledger. Inside
            the workspace it can set up the shop, its programs and its staff; it cannot take a
            visit, read a customer record, export, or touch billing.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * How long this shop has to pay a due invoice before it drops to Launch.
 * Unset is the standard seven days from the invoice; an extension is one
 * date, written to the audit ledger by the API.
 */
function GraceCard({ tenant }: { tenant: Tenant }) {
  const [until, setUntil] = useState(tenant.graceUntil ?? "");
  const [outcome, setOutcome] = useState<string | null>(null);
  const save = useApiMutation(
    (next: string | null) => setTenantGrace(tenant.businessId ?? "", next),
    {
      invalidates: [keys.admin.tenants(), keys.admin.audit()],
      onSuccess: (saved) =>
        setOutcome(
          saved.graceUntil
            ? `Grace extended to ${longDate(saved.graceUntil)}.`
            : "Back to the standard seven days.",
        ),
      onError: (failure) => setOutcome(failure.message),
    },
  );
  return (
    <div className="mt-5">
      <Eyebrow>Payment grace</Eyebrow>
      <p className="mt-2 text-[11px] leading-relaxed text-white/55">
        An unpaid invoice moves the shop to Launch seven days after it is issued. Extend that here
        for a shop that has asked for time; their data and programs are kept either way.
      </p>
      <div className="mt-3 flex gap-2">
        <Input
          type="date"
          surface="dark"
          aria-label="Grace until"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
          className="flex-1"
        />
        <Button
          tone="accent"
          size="lg"
          disabled={!tenant.businessId || !until || until === tenant.graceUntil || save.isPending}
          onClick={() => save.mutate(until)}
        >
          {save.isPending ? "Saving…" : "Extend"}
        </Button>
        {tenant.graceUntil && (
          <Button tone="ghost" size="lg" disabled={save.isPending} onClick={() => { setUntil(""); save.mutate(null); }}>
            Reset
          </Button>
        )}
      </div>
      <FormMessage surface="dark" tone={save.isError ? "error" : "success"} className="mt-2">
        {outcome}
      </FormMessage>
    </div>
  );
}

/**
 * The FAQ's "scoped support access", opened from here. Opening steps this
 * session into the shop and the business portal, which shares the cookie,
 * opens in a new tab. Ending is one press; expiry is the API's clock.
 */
function SupportAccessCard({ tenant }: { tenant: Tenant }) {
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState<(typeof SUPPORT_MINUTES)[number]>(60);
  const [refused, setRefused] = useState<string | null>(null);
  const invalidates = [keys.admin.tenants(), keys.admin.audit(), keys.session.all];
  const open = useApiMutation(
    () => openSupportAccess(tenant.businessId ?? "", { reason: reason.trim(), minutes }),
    {
      invalidates,
      onSuccess: () => {
        setRefused(null);
        setReason("");
        window.open(BUSINESS_APP_URL, "_blank", "noopener");
      },
      onError: (failure) => setRefused(failure.message),
    },
  );
  const end = useApiMutation((grantId: string) => endSupportAccess(grantId), {
    invalidates,
    onError: (failure) => setRefused(failure.message),
  });
  const live = tenant.support ?? null;

  return (
    <div className="mt-5">
      <Eyebrow>Support access</Eyebrow>
      {live ? (
        <div className="mt-2 rounded-2xl border border-[var(--accent)]/40 bg-white/5 p-3">
          <p className="text-xs font-extrabold">Open until {timeOfDay(live.expiresAt)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/65">{live.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={BUSINESS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ tone: "accent", size: "sm" })}
            >
              <ExternalLink size={13} aria-hidden="true" /> Open workspace
            </a>
            <Button tone="danger" size="sm" disabled={end.isPending} onClick={() => end.mutate(live.id)}>
              {end.isPending ? "Ending…" : "End access"}
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="mt-2 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim()) open.mutate();
          }}
        >
          <Input
            surface="dark"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            required
            aria-label="Why you are opening this workspace"
            placeholder="Why - the owner reads this, and so does the ledger"
          />
          <div className="flex gap-2">
            <Select
              surface="dark"
              aria-label="How long support access stays open"
              value={minutes}
              onChange={(event) =>
                setMinutes(Number(event.target.value) as (typeof SUPPORT_MINUTES)[number])
              }
              className="flex-1"
            >
              {SUPPORT_MINUTES.map((option) => (
                <option key={option} value={option}>
                  {option} minutes
                </option>
              ))}
            </Select>
            <Button
              tone="accent"
              size="lg"
              type="submit"
              disabled={!tenant.businessId || !reason.trim() || open.isPending}
            >
              {open.isPending ? "Opening…" : "Open"}
            </Button>
          </div>
        </form>
      )}
      <FormMessage surface="dark" tone="error" className="mt-2">
        {refused}
      </FormMessage>
    </div>
  );
}

/** Which account managers may open support access here. Administrators only;
 *  the API refuses everyone else. */
function ManagersCard({ tenant }: { tenant: Tenant }) {
  const { data: administrators = [] } = useAdministrators();
  const managers = administrators.filter((person) => person.role === "account_manager");
  const [chosen, setChosen] = useState<string[]>(tenant.managerIds ?? []);
  const [outcome, setOutcome] = useState<string | null>(null);
  const save = useApiMutation(
    (userIds: string[]) => setTenantManagers(tenant.businessId ?? "", userIds),
    {
      invalidates: [keys.admin.tenants(), keys.admin.audit()],
      onSuccess: (saved) => setOutcome(`${saved.managerIds?.length ?? 0} assigned.`),
      onError: (failure) => setOutcome(failure.message),
    },
  );
  const dirty = [...chosen].sort().join() !== [...(tenant.managerIds ?? [])].sort().join();

  return (
    <div className="mt-5">
      <Eyebrow>Account managers</Eyebrow>
      {managers.length === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">
          No account managers yet. Add one under Platform settings and they appear here.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-white/12 border-y border-white/12 text-xs">
          {managers.map((person) => (
            <li key={person.id}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3">
                <Checkbox
                  surface="dark"
                  checked={chosen.includes(person.id)}
                  disabled={!person.isActive}
                  onChange={(event) =>
                    setChosen((current) =>
                      event.target.checked
                        ? [...current, person.id]
                        : current.filter((id) => id !== person.id),
                    )
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{person.name}</span>
                  <span className="block truncate text-[10px] text-white/50">{person.email}</span>
                </span>
                {!person.isActive && <span className="text-[10px] text-white/50">Disabled</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {managers.length > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <FormMessage surface="dark" tone={save.isError ? "error" : "success"}>
            {outcome}
          </FormMessage>
          <Button
            tone="accent"
            className="ml-auto"
            disabled={!tenant.businessId || !dirty || save.isPending}
            onClick={() => save.mutate(chosen)}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Who signed up and then stalled.
 *
 * A workspace is live the moment it is created, so the useful question is
 * not who is waiting but who got stuck, and on which step.
 */
function OnboardingPanel() {
  const { data: rows = [], isPending, error, refetch } = useOnboarding();
  const stalled = rows.filter((row) => row.stepsDone < row.stepsTotal);

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] p-5">
        <Eyebrow>Setup</Eyebrow>
        <h2 className="mt-1 text-lg font-extrabold">
          {stalled.length
            ? `${stalled.length} of ${rows.length} still setting up`
            : "Every workspace is set up"}
        </h2>
      </div>
      <div className="p-4">
        <QueryBoundary
          isPending={isPending}
          error={error}
          onRetry={refetch}
          label="onboarding progress"
          rows={3}
        >
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--muted-strong)]">No workspaces yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {rows.map((row) => (
                <li key={row.merchantId} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{row.name}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted-strong)]">
                      {row.plan} · joined {relativeTime(row.createdAt)}
                    </p>
                  </div>
                  <div className="hidden gap-1.5 sm:flex">
                    {(
                      [
                        ["Program", row.hasProgram],
                        ["Location", row.hasLocation],
                        ["Staff", row.hasStaff],
                        ["First stamp", row.hasFirstStamp],
                      ] as const
                    ).map(([label, done]) => (
                      <span
                        key={label}
                        className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                          done
                            ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
                            : "bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <Pill tone={row.stepsDone === row.stepsTotal ? "success" : "warning"}>
                    {row.stepsDone}/{row.stepsTotal}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}
