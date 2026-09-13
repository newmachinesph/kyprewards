"use client";

import { useState } from "react";
import {
  ApiError,
  changePlan,
  startPlanCheckout,
  isPreview,
  keys,
  purchaseCredits,
  startInvoicePayment,
  useApiMutation,
  useBilling,
  useBusinessProfile,
  useSettings,
  type CreditBundle,
  type QrPayment,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, PreviewBadge, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { longDate, peso, pesoFromCentavos } from "@kypstamping/ui/format";
import { Check, CreditCard, QrCode, Sparkles } from "lucide-react";
import { addOns, foundingOffer, paymentMethods, plans } from "@/lib/plans";
import { refusal, retryOnce } from "@/lib/plan";
import { useSetSetting } from "@/components/mutations";
import { PaymentSheet } from "@/components/views/PaymentSheet";
import { BlockedNote, Field, inputClass, onlyDigits, type Notify } from "@/components/views/shared";

const OPENS_WITH_BILLING = "Opens with billing";
const NOT_OPEN = "Not open yet, free during the beta";

/** `"₱0.95 · ₱0.90 · ₱0.85 per segment"` → `[0.95, 0.9, 0.85]`, from plans.ts. */
const smsRates = (addOns.find((addOn) => addOn.name === "SMS credits")?.price.match(/₱([\d.]+)/g) ?? [])
  .map((match) => Number(match.slice(1)));

const BUNDLES: { bundle: CreditBundle; label: string; segments: number | null; rate: number }[] = [
  { bundle: "payg", label: "Pay as you go", segments: null, rate: smsRates[0] ?? 0 },
  { bundle: "1000", label: "1,000 segments", segments: 1000, rate: smsRates[1] ?? 0 },
  { bundle: "5000", label: "5,000 segments", segments: 5000, rate: smsRates[2] ?? 0 },
];

/** Preferences that write through `setSetting`. */
const BILLING_PREFERENCES = [
  ["autoTopUpSms", "Top up SMS credits automatically", "Buy 500 more whenever the balance drops under 200"],
  ["invoiceEmails", "Email invoices to the owner", ""],
] as const;

export function BillingView({ notify }: { notify: Notify }) {
  const { data: billing, isPending, error, refetch } = useBilling();
  const { data: profile } = useBusinessProfile();
  const { data: settings = {} } = useSettings();
  const setSetting = useSetSetting();
  const [yearly, setYearly] = useState(false);
  const [bundle, setBundle] = useState<CreditBundle>("payg");
  const [segments, setSegments] = useState("500");
  const [sheet, setSheet] = useState<{ intent: QrPayment; title: string } | null>(null);

  const choose = useApiMutation(
    (plan: string) => retryOnce(() => changePlan(plan, yearly ? "Yearly" : "Monthly")),
    { invalidates: [keys.business.billing(), keys.business.profile()] },
  );
  // A move up costs its first period. The API says so with a 402, and the
  // code to pay comes from here; the plan changes when the payment settles.
  const checkout = useApiMutation((plan: string) =>
    retryOnce(() => startPlanCheckout(plan, yearly ? "Yearly" : "Monthly")),
  );
  const buyCredits = useApiMutation(
    (body: Parameters<typeof purchaseCredits>[0]) => retryOnce(() => purchaseCredits(body)),
    { invalidates: [keys.business.billing()] },
  );
  const payInvoice = useApiMutation((invoiceId: string) => retryOnce(() => startInvoicePayment(invoiceId)), {
    invalidates: [keys.business.billing()],
  });

  if (!billing) {
    return (
      <ViewFrame eyebrow="Account" title="Billing & plan" description="The ladder, the founding offer, add-ons, credits and invoices.">
        <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="billing" rows={5}>
          <p className="text-sm text-[var(--muted-strong)]">No billing record found.</p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  const paidTiersOpen = billing.paidTiersOpen === true;
  const creditsOpen = billing.creditPurchasesOpen === true;
  const preview = isPreview(billing);
  const chosen = BUNDLES.find((entry) => entry.bundle === bundle) ?? BUNDLES[0];
  const segmentCount = chosen.segments ?? (Number(segments) || 0);
  const totalCentavos = Math.round(segmentCount * chosen.rate * 100);
  const creditsBlocked = !creditsOpen ? OPENS_WITH_BILLING : null;
  const invoicesBlocked = !paidTiersOpen ? OPENS_WITH_BILLING : null;

  return (
    <ViewFrame
      eyebrow="Account"
      title="Billing & plan"
      description="Launch is live and free. The paid tiers are published so you can see where this goes; they carry no date, and founding merchants move to Core free when it opens."
      action={preview ? <PreviewBadge /> : undefined}
    >
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between">
            <Eyebrow>Current plan</Eyebrow>
            <Pill tone="success">Active</Pill>
          </div>
          <p className="mt-6 text-3xl font-extrabold">
            {billing.plan} · {pesoFromCentavos(billing.monthlyCentavos)} a month
          </p>
          <p className="mt-1 text-xs text-white/55">
            {billing.cycle} billing{profile ? ` · renews ${longDate(profile.renewalOn)}` : ""}
          </p>
          <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
            {billing.allowances.map((item) => {
              const unlimited = item.included === 0;
              const pct = unlimited ? 0 : Math.min(100, Math.round((item.used / item.included) * 100));
              return (
                <div key={item.label} className="py-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/55">{item.label}</span>
                    <strong>
                      {unlimited
                        ? `${item.used.toLocaleString()} · no limit`
                        : `${item.used.toLocaleString()} / ${item.included.toLocaleString()} ${item.unit}`}
                    </strong>
                  </div>
                  {!unlimited && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/12">
                      <div className={`h-full rounded-full ${pct >= 90 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-white/55">
            Plus {billing.smsCreditBalance.toLocaleString()} prepaid SMS segments. Credits are bought separately and do not expire.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--accent)] bg-[rgb(232_163_61/10%)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Founding offer</Eyebrow>
            <Sparkles size={18} className="text-[var(--accent-strong)]" />
          </div>
          {billing.founding ? (
            <>
              <p className="mt-5 text-lg font-extrabold">You are a founding merchant.</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                {foundingOffer.headline}
                {billing.foundingCreditApplied
                  ? ` Your ${billing.foundingCreditMonths ?? 3} free months of Core have been applied; the next invoice date on this page is when they end.`
                  : billing.foundingCreditMonths
                    ? ` Your workspace has ${billing.foundingCreditMonths} months of Core credited, applied the moment you move to Core.`
                    : ""}
              </p>
            </>
          ) : (
            <>
              <p className="mt-5 text-lg font-extrabold">{foundingOffer.headline}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{foundingOffer.detail}</p>
            </>
          )}
        </article>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>The ladder</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Four plans, no dates</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="Show yearly prices"
              onClick={() => setYearly((value) => !value)}
              className={`relative h-6 w-10 shrink-0 rounded-full ${yearly ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
            >
              <span className={`absolute top-1 size-4 rounded-full bg-white transition ${yearly ? "left-5" : "left-1"}`} />
            </button>
            <span className="text-xs font-bold">
              {yearly ? "Yearly price, billed twelve months at a time" : "Monthly price"}
            </span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const current = plan.name === billing.plan;
            const price = yearly ? plan.yearly : plan.monthly;
            const openable = plan.available || paidTiersOpen;
            return (
              <article key={plan.key} className={`flex flex-col rounded-2xl border p-5 ${current ? "border-[var(--ink)]" : plan.featured ? "border-[var(--accent)]" : "border-[var(--line)]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-extrabold">{plan.name}</p>
                  {current ? (
                    <Pill tone="success">Your plan</Pill>
                  ) : plan.available ? (
                    <Pill tone="success">Live</Pill>
                  ) : (
                    <Pill tone="warning">Not open yet</Pill>
                  )}
                </div>
                <p className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                  {peso(price)}
                  <span className="text-xs font-bold text-[var(--muted)]"> / month</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">{plan.description}</p>
                <ul className="mt-4 space-y-1.5 text-xs">
                  {plan.highlights.map((line) => (
                    <li key={line} className="flex gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-[var(--success)]" /> {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <Button
                    tone={current ? "quiet" : plan.featured ? "accent" : "dark"}
                    className="w-full"
                    disabled={current || !openable || choose.isPending || checkout.isPending}
                    title={!openable ? NOT_OPEN : undefined}
                    onClick={() =>
                      choose.mutate(plan.key, {
                        onSuccess: (saved) => notify(`Moved to ${saved.plan}.`),
                        onError: (failure) => {
                          if (failure instanceof ApiError && failure.status === 402) {
                            checkout.mutate(plan.key, {
                              onSuccess: (intent) =>
                                setSheet({ intent, title: `${plan.key} · first ${yearly ? "year" : "month"}` }),
                              onError: (again) => notify(refusal(again), "error"),
                            });
                            return;
                          }
                          notify(refusal(failure), "error");
                        },
                      })
                    }
                  >
                    {current ? "Your plan" : plan.cta}
                  </Button>
                  {!openable && !current && (
                    <p className="mt-2 text-center text-[11px] font-semibold text-[var(--muted-strong)]">{NOT_OPEN}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="space-y-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>How you pay</Eyebrow>
              <QrCode size={18} className="text-[var(--accent-strong)]" />
            </div>
            <p className="mt-4 text-sm font-extrabold">QR Ph only</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
              Every payment is a QR Ph code you scan with GCash, Maya or your bank app. Nothing is stored here: no card on file, no chooser.
              {billing.paymentMethods?.length ? ` The account accepts ${billing.paymentMethods.join(", ").toUpperCase()}.` : ""}
              {" "}The site lists {paymentMethods.join(", ")}; through QR Ph they all land the same way.
            </p>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {billing.invoices.length === 0 ? (
                <p className="py-3 text-xs text-[var(--muted-strong)]">No invoices. Launch is free.</p>
              ) : (
                billing.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold">{invoice.period}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">Issued {longDate(invoice.issuedOn)}</p>
                    </div>
                    <span className="text-xs font-bold">{pesoFromCentavos(invoice.amountCentavos)}</span>
                    <Pill tone={invoice.status === "Due" ? "warning" : "success"}>{invoice.status}</Pill>
                    {invoice.status === "Due" && (
                      <Button
                        tone="quiet"
                        className="min-h-9 px-3 text-xs"
                        disabled={Boolean(invoicesBlocked) || payInvoice.isPending}
                        title={invoicesBlocked ?? undefined}
                        onClick={() =>
                          payInvoice.mutate(invoice.id, {
                            onSuccess: (intent) => setSheet({ intent, title: `Invoice · ${invoice.period}` }),
                            onError: (failure) => notify(refusal(failure), "error"),
                          })
                        }
                      >
                        Pay by QR Ph
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            {billing.invoices.some((invoice) => invoice.status === "Due") && <BlockedNote reason={invoicesBlocked} />}
            <div className="mt-4 space-y-1">
              {BILLING_PREFERENCES.map(([key, label, detail]) => (
                <div key={key} className="flex items-start gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{label}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted)]">
                      {detail || (profile ? `Sent to ${profile.owner}` : "")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(settings[key])}
                    aria-label={label}
                    disabled={setSetting.isPending}
                    onClick={() => {
                      const next = !settings[key];
                      setSetting.mutate(
                        { key, value: next },
                        {
                          onSuccess: () => notify(`${label} ${next ? "turned on" : "turned off"}.`),
                          onError: (failure) => notify(refusal(failure), "error"),
                        },
                      );
                    }}
                    className={`relative h-6 w-10 shrink-0 rounded-full ${settings[key] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span className={`absolute top-1 size-4 rounded-full bg-white transition ${settings[key] ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <Eyebrow>Add-ons</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Bought on any plan, priced apart</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    <th className="px-5 py-3">Add-on</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Plans</th>
                    <th className="px-4 py-3">What it is</th>
                  </tr>
                </thead>
                <tbody>
                  {addOns.map((addOn) => (
                    <tr key={addOn.name} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-5 py-4 text-sm font-extrabold">{addOn.name}</td>
                      <td className="px-4 py-4 text-sm font-bold">{addOn.price}</td>
                      <td className="px-4 py-4 text-xs">{addOn.plans}</td>
                      <td className="px-4 py-4 text-xs leading-relaxed text-[var(--muted-strong)]">{addOn.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>SMS credits</Eyebrow>
            <CreditCard size={18} className="text-[var(--accent-strong)]" />
          </div>
          <p className="mt-4 text-2xl font-extrabold">{billing.smsCreditBalance.toLocaleString()} segments</p>
          <p className="mt-1 text-xs text-[var(--muted-strong)]">
            Bought, not bundled. Every send shows its cost first, and unused segments keep.
          </p>
          <fieldset className="mt-5">
            <legend className="text-xs font-bold">Bundle</legend>
            <div className="mt-2 grid gap-2">
              {BUNDLES.map((option) => (
                <button
                  key={option.bundle}
                  type="button"
                  aria-pressed={bundle === option.bundle}
                  onClick={() => setBundle(option.bundle)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${bundle === option.bundle ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
                >
                  <span className="font-extrabold">{option.label}</span>
                  <span className="text-xs font-bold">₱{option.rate.toFixed(2)} / segment</span>
                </button>
              ))}
            </div>
          </fieldset>
          {bundle === "payg" && (
            <div className="mt-3">
              <Field label="Segments">
                <input value={segments} onChange={(event) => setSegments(onlyDigits(event.target.value))} inputMode="numeric" className={inputClass} />
              </Field>
            </div>
          )}
          <div className="mt-4 rounded-2xl bg-[var(--paper)] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">Total</p>
            <p className="mt-1 text-2xl font-extrabold">{pesoFromCentavos(totalCentavos)}</p>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">
              {segmentCount.toLocaleString()} segments × ₱{chosen.rate.toFixed(2)}
            </p>
          </div>
          <Button
            className="mt-4 w-full"
            icon={<QrCode size={15} />}
            disabled={Boolean(creditsBlocked) || segmentCount <= 0 || buyCredits.isPending}
            title={creditsBlocked ?? undefined}
            onClick={() =>
              buyCredits.mutate(
                { bundle, segments: segmentCount },
                {
                  onSuccess: (intent) => setSheet({ intent, title: "SMS credits" }),
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            {buyCredits.isPending ? "Preparing…" : creditsBlocked ? "SMS credits open with billing" : "Buy by QR Ph"}
          </Button>
          <BlockedNote reason={creditsBlocked} />
        </aside>
      </div>

      {sheet && <PaymentSheet intent={sheet.intent} title={sheet.title} onClose={() => setSheet(null)} />}
    </ViewFrame>
  );
}
