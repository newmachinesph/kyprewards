import { Check, Minus } from "lucide-react";
import { SiteButton } from "@/components/MarketingUi";
import {
  addOns,
  channelRates,
  featureMatrix,
  plans,
  type Cell,
} from "@kyprewards/ui/plans";

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

/**
 * The featured column, as three tints of one amber rather than three
 * different opacities.
 *
 * They are flat colours, not alpha: the group rows sit on a grey band and
 * the rest on paper, so an alpha that looks right over one is wrong over the
 * other — which is what made the column look striped.
 */
const FEATURED = {
  head: "bg-[#f0dfbe]",
  /** Over the grey group band. */
  band: "bg-[#ede3d3]",
  /** Over paper. */
  cell: "bg-[#f9f1e5]",
};

/** Side borders, so the column stays one object across every band it crosses. */
const EDGE = "border-x border-[rgb(232_163_61/45%)]";

/**
 * Above the table, not below it.
 *
 * It sat after the last row, which on a phone is several screens past the
 * point a reader decides the table is broken - and two of the three tables
 * had no hint at all.
 */
function ScrollHint({ what }: { what: string }) {
  return (
    <p className="mb-3 text-xs leading-relaxed text-[var(--muted)] sm:hidden">
      Scroll the table sideways to see {what}.
    </p>
  );
}

export function PricingTable() {
  return (
    <div>
      <ScrollHint what="every plan" />
      {/* Wide content scrolls inside its own container so the page body never does. */}
      <div className="relative -mx-4 overflow-x-auto px-4 [overflow-y:clip] sm:mx-0 sm:px-0">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">
            Full feature comparison across the Launch, Core, Grow, and Scale
            plans
          </caption>
          {/* Not sticky, and it never usefully was.
              The wrapper above scrolls horizontally, which makes it the
              sticky containing block — so `top: 72px` never measured against
              the page, it just pushed the header 72px down inside the table
              and left an empty band at the top. The featured column's
              collapsed side borders painted straight through that band, which
              is the stray outlined box above the Grow header. A pinned header
              is no use on a table you drag sideways anyway. */}
          <thead className="z-20">
            <tr>
              <th
                scope="col"
                className="w-[190px] border-b border-[var(--line-strong)] bg-[var(--paper)] px-5 py-5 align-bottom sm:w-[38%]"
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
                      ? `${FEATURED.head} ${EDGE} border-t border-t-[rgb(232_163_61/45%)]`
                      : "bg-[var(--paper)]"
                  }`}
                >
                  <span className="font-display block text-base font-bold tracking-[-0.02em]">
                    {plan.name}
                  </span>
                  {/* Always the monthly rate. The cards above default to the
                      yearly one, so the same plan appeared at two prices on
                      one page with nothing saying which was which — a buyer
                      comparing us against a competitor quoted the wrong
                      figure back to us. This table does not follow that
                      toggle, so it says what it is showing. */}
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {plan.monthly === 0
                      ? "Free"
                      : `₱${plan.monthly.toLocaleString()}/mo billed monthly`}
                  </span>
                  {/* The cards above mark an unsellable tier and this header did
                      not, so the amber column read as the recommended thing to
                      buy while being the one thing you cannot. */}
                  {!plan.available && (
                    <span className="mt-1.5 inline-block rounded-full border border-current px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                      Coming soon
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {featureMatrix.map((section) => (
            <tbody key={section.group}>
              <tr>
                {/* Not colSpan across the whole table any more. It used to
                    paint a flat grey straight through the featured column,
                    which is what broke the highlight into blocks. */}
                <th
                  scope="colgroup"
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
                {plans.map((plan) => (
                  <td
                    key={plan.key}
                    aria-hidden="true"
                    className={`border-b border-[var(--line)] ${
                      plan.featured
                        ? `${FEATURED.band} ${EDGE}`
                        : "bg-[var(--surface-2)]"
                    }`}
                  />
                ))}
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
                      <span className="mt-1 block max-w-[24ch] text-xs font-normal leading-relaxed text-[var(--muted)] sm:max-w-[46ch]">
                        {row.hint}
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={plans[index].key}
                      className={`px-4 py-4 text-center align-top text-sm ${
                        plans[index].featured ? `${FEATURED.cell} ${EDGE}` : ""
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
                    plan.featured
                      ? `${FEATURED.cell} ${EDGE} border-b border-b-[rgb(232_163_61/45%)]`
                      : ""
                  }`}
                >
                  {/* The cards at the top of the page and this row at the
                      bottom both sell, so both have to stop selling a tier
                      that is not open yet. */}
                  {plan.available ? (
                    <SiteButton
                      href="/partners"
                      tone={plan.featured ? "accent" : "outline"}
                    >
                      {plan.cta}
                    </SiteButton>
                  ) : (
                    <p className="text-sm font-bold opacity-50">Coming soon</p>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function ChannelRates() {
  return (
    <div>
      <ScrollHint what="what each channel costs" />
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)]">
        <div className="relative -mx-px overflow-x-auto">
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
                    <span className="mt-1.5 block max-w-[24ch] text-xs font-normal leading-relaxed text-[var(--muted)] sm:max-w-[52ch]">
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
    </div>
  );
}

/** Bought on top of a plan. Same table shape as the channels so the eye reads both the same way. */
export function AddOns() {
  return (
    <div>
      <ScrollHint what="which plans each add-on is on, and its price" />
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)]">
        <div className="relative -mx-px overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Add-ons available on top of any plan
            </caption>
            <thead>
              <tr className="border-b border-[var(--line)]">
                {["Add-on", "Available on", "Price"].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addOns.map((item) => (
                <tr
                  key={item.name}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-6 py-5 text-left align-top text-sm font-bold"
                  >
                    {item.name}
                    <span className="mt-1.5 block max-w-[24ch] text-xs font-normal leading-relaxed text-[var(--muted)] sm:max-w-[52ch]">
                      {item.detail}
                    </span>
                  </th>
                  <td className="px-6 py-5 align-top text-sm text-[var(--muted-strong)]">
                    {item.plans}
                  </td>
                  <td className="px-6 py-5 align-top text-sm font-bold text-[var(--accent-strong)]">
                    {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
