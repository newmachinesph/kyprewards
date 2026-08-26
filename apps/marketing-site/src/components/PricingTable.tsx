import { Check, Minus } from "lucide-react";
import { SiteButton } from "@/components/MarketingUi";
import { channelRates, featureMatrix, plans, type Cell } from "@/lib/plans";

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <span className="sr-only">Included</span>
        <span
          aria-hidden="true"
          className="mx-auto grid size-6 place-items-center rounded-full bg-[rgb(232_163_61/18%)] text-[var(--accent-strong)]"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span className="sr-only">Not included</span>
        <Minus
          size={14}
          aria-hidden="true"
          className="mx-auto text-[var(--line-strong)]"
        />
      </>
    );
  }
  return <span className="font-bold">{value}</span>;
}

export function PricingTable() {
  return (
    <div>
      {/* Wide content scrolls inside its own container so the page body never does. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">
            Full feature comparison across the Launch, Core, Grow, and Scale
            plans
          </caption>
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                scope="col"
                className="w-[38%] border-b border-[var(--line-strong)] bg-[var(--paper)] px-5 py-5 align-bottom"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                  Compare all features
                </span>
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.key}
                  scope="col"
                  className={`border-b border-[var(--line-strong)] px-4 py-5 text-center align-bottom ${
                    plan.featured
                      ? "bg-[rgb(232_163_61/10%)]"
                      : "bg-[var(--paper)]"
                  }`}
                >
                  <span className="font-display block text-base font-bold tracking-[-0.02em]">
                    {plan.name}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {plan.monthly === 0
                      ? "Free"
                      : `₱${plan.monthly.toLocaleString()}/mo`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {featureMatrix.map((section) => (
            <tbody key={section.group}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={5}
                  className="border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-left"
                >
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink)]">
                    {section.group}
                  </span>
                  {section.note && (
                    <span className="ml-3 text-xs font-normal normal-case tracking-normal text-[var(--muted-strong)]">
                      {section.note}
                    </span>
                  )}
                </th>
              </tr>
              {section.rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-5 py-4 text-left align-top text-sm font-semibold"
                  >
                    {row.label}
                    {row.hint && (
                      <span className="mt-1 block max-w-[46ch] text-xs font-normal leading-relaxed text-[var(--muted)]">
                        {row.hint}
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={plans[index].key}
                      className={`px-4 py-4 text-center align-top text-sm ${
                        plans[index].featured
                          ? "bg-[rgb(232_163_61/6%)]"
                          : ""
                      }`}
                    >
                      <CellValue value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}

          <tfoot>
            <tr>
              <td className="border-t border-[var(--line-strong)] px-5 py-6" />
              {plans.map((plan) => (
                <td
                  key={plan.key}
                  className={`border-t border-[var(--line-strong)] px-4 py-6 text-center ${
                    plan.featured ? "bg-[rgb(232_163_61/6%)]" : ""
                  }`}
                >
                  <SiteButton
                    href="/contact"
                    tone={plan.featured ? "accent" : "outline"}
                  >
                    {plan.cta}
                  </SiteButton>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--muted)] sm:hidden">
        Scroll the table sideways to see every plan.
      </p>
    </div>
  );
}

export function ChannelRates() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface)]">
      <div className="-mx-px overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">
            Included message volume and add-on rates for each delivery channel
          </caption>
          <thead>
            <tr className="border-b border-[var(--line)]">
              {["Channel", "Included with your plan", "Add-on rate"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {channelRates.map((rate) => (
              <tr
                key={rate.channel}
                className="border-b border-[var(--line)] last:border-b-0"
              >
                <th
                  scope="row"
                  className="px-6 py-5 text-left align-top text-sm font-bold"
                >
                  {rate.channel}
                  <span className="mt-1.5 block max-w-[52ch] text-xs font-normal leading-relaxed text-[var(--muted)]">
                    {rate.detail}
                  </span>
                </th>
                <td className="px-6 py-5 align-top text-sm text-[var(--muted-strong)]">
                  {rate.included}
                </td>
                <td className="px-6 py-5 align-top text-sm font-bold text-[var(--accent-strong)]">
                  {rate.overage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
