"use client";

import { isPreview, useAddOns, type AddOnSubscription } from "@kypstamping/api";
import { Eyebrow, Pill, PreviewBadge, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { longDate, pesoFromCentavos } from "@kypstamping/ui/format";
import { ADD_ONS, SMS_RATES } from "@/lib/catalog";

/**
 * What merchants buy on top of a plan, and what it brings in.
 *
 * The catalogue is the pricing page's; the subscriptions are the API's. Until
 * `/admin/add-ons` ships the rows are samples under a badge, and the totals
 * say so.
 */
export function AdminAddOnsView() {
  const { data: addOns = [], isPending, error, refetch } = useAddOns();
  const preview = isPreview(addOns);
  const active = addOns.filter((item) => item.status === "active");
  const mrr = active.reduce((sum, item) => sum + item.priceCentavos, 0);

  return (
    <ViewFrame
      wide
      className="admin-grid"
      eyebrow="Revenue"
      title="Add-ons"
      description="Bought on any plan and priced apart from the subscription: visibility, help and volume. Nothing here charges a merchant for growing."
      action={preview ? <PreviewBadge /> : undefined}
    >
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="add-on subscriptions"
        rows={4}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ADD_ONS.map((addOn) => {
            const theirs = addOns.filter((item) => item.addOn === addOn.key);
            const activeTheirs = theirs.filter((item) => item.status === "active");
            const theirMrr = activeTheirs.reduce((sum, item) => sum + item.priceCentavos, 0);
            const inactive = theirs.length - activeTheirs.length;
            return (
              <article
                key={addOn.key}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-extrabold">{addOn.name}</p>
                  <Pill tone="neutral">{addOn.plans.split(";")[0]}</Pill>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {pesoFromCentavos(addOn.priceCentavos)} {addOn.unit}
                </p>
                <p className="mt-4 text-3xl font-extrabold tracking-[-0.03em]">
                  {addOn.key === "email_topup" ? "—" : activeTheirs.length}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  {addOn.key === "email_topup"
                    ? "Sold as bundles; the API does not list them yet"
                    : `active · ${pesoFromCentavos(theirMrr)} a month${inactive ? ` · ${inactive} pending or cancelled` : ""}`}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  {addOn.detail}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5">
              <div>
                <Eyebrow>Subscriptions</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold">
                  {active.length} active · {pesoFromCentavos(mrr)} a month
                </h2>
              </div>
              {preview && <PreviewBadge />}
            </div>
            {addOns.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">
                No add-on has been bought yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {["Business", "Add-on", "Status", "Price", "Renews"].map((column) => (
                        <th key={column} scope="col" className="px-4 py-3 first:px-5">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addOns.map((item) => (
                      <AddOnRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="border-t border-[var(--line)] px-5 py-3 text-[10px] font-semibold text-[var(--muted)]">
              Showing {addOns.length} subscription{addOns.length === 1 ? "" : "s"}. Featured on Grow
              and Scale is part of the plan and does not appear here.
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <Eyebrow>SMS credits</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Bought, never bundled</h2>
              <p className="mt-1 text-xs text-[var(--muted-strong)]">
                Per 160-character segment. Unused credits are kept; cost is shown before every
                send.
              </p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th scope="col" className="px-5 py-3">
                    Bundle
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Per segment
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {SMS_RATES.map((rate) => (
                  <tr key={rate.bundle} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-5 py-3.5 text-sm font-extrabold">{rate.bundle}</td>
                    <td className="px-4 py-3.5 text-sm">
                      {pesoFromCentavos(rate.perSegmentCentavos)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold">
                      {rate.totalCentavos === null ? "As sent" : pesoFromCentavos(rate.totalCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-[var(--line)] px-5 py-3 text-[10px] font-semibold text-[var(--muted)]">
              Credit purchases open with the billing.credit_purchases flag in Platform settings.
            </p>
          </section>
        </div>
      </QueryBoundary>
    </ViewFrame>
  );
}

function AddOnRow({ item }: { item: AddOnSubscription }) {
  return (
    <tr className="border-b border-[var(--line)] last:border-0">
      <td className="px-5 py-3.5">
        <p className="text-sm font-extrabold">{item.business}</p>
        <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">{item.merchantId}</p>
      </td>
      <td className="px-4 py-3.5 text-xs font-bold">
        {ADD_ONS.find((a) => a.key === item.addOn)?.name ?? item.addOn}
      </td>
      <td className="px-4 py-3.5">
        <Pill
          tone={
            item.status === "active" ? "success" : item.status === "pending" ? "warning" : "neutral"
          }
        >
          {item.status}
        </Pill>
      </td>
      <td className="px-4 py-3.5 text-sm font-bold">
        {item.priceCentavos === 0 ? "Free" : pesoFromCentavos(item.priceCentavos)}
      </td>
      <td className="px-4 py-3.5 text-xs text-[var(--muted-strong)]">
        {item.renewsOn ? longDate(item.renewsOn) : "—"}
      </td>
    </tr>
  );
}
