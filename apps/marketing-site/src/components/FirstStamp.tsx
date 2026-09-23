import {
  ArrowRight,
  QrCode,
  ScanLine,
  Smartphone,
  UserRoundCheck,
} from "lucide-react";
import { SiteEyebrow } from "@/components/MarketingUi";

/**
 * The onboarding story: identity first, value on the first visit.
 *
 * The distinction the whole model rests on — the store code is how a stranger
 * becomes a member, the customer's own code is how a member earns — has one
 * rule underneath it: the public code grants nothing of value. It creates a
 * member and drops a *pending* welcome stamp that only becomes real when a
 * staff member confirms the first visit. Farm the poster all you like: you get
 * pending stamps, and pending stamps are worth exactly nothing until someone
 * walks in.
 *
 * That keeps the emotional hook (a stamp waiting for you before anyone asked
 * for anything) and removes the abuse case in the same move, without a rolling
 * code, a receipt token, or any staff involvement at the moment of joining.
 */

const STEPS = [
  {
    icon: QrCode,
    label: "Scan the shop code",
    body: "On the counter, on the receipt, on a sticker by the till, in your Instagram bio. No app to download — it opens in the browser they already have.",
  },
  {
    icon: Smartphone,
    label: "Join with a number",
    body: "One mobile number, once. A welcome stamp lands on their card straight away, marked pending — they can see it waiting before they have bought a thing.",
  },
  {
    icon: ScanLine,
    label: "First visit makes it real",
    body: "Your staff scan their code. The welcome stamp confirms and the visit earns its own, so the card reads two. That is the moment value changes hands, and it happens in your shop.",
  },
  {
    icon: UserRoundCheck,
    label: "Every visit after",
    body: "Staff scan the customer's own code, or find them by mobile number. About three seconds, and nobody stamps themselves.",
  },
];

export function FirstStamp() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <SiteEyebrow>No sign-up wall</SiteEyebrow>
            <h2 className="mt-6 max-w-[15ch] text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-5xl">
              Give people something before you ask them for anything.
            </h2>
          </div>
          <p className="max-w-[62ch] text-base leading-relaxed text-[var(--muted-strong)] lg:text-lg">
            Most loyalty programs open with a form. A queue builds, the offer
            stops being worth it, and the customer says no thanks. KYP Rewards
            turns that around: a welcome stamp is already waiting on their card
            the moment they join, and the first visit turns it into a real one
            — with your staff, in your shop, in seconds.
          </p>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.label} className="relative bg-[var(--paper)] p-7">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent-strong)]">
                  <step.icon size={19} />
                </span>
                <span className="font-mono text-xs font-bold text-[var(--muted)]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-base font-extrabold">{step.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9">
            <SiteEyebrow>Two codes, two jobs</SiteEyebrow>
            <dl className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-extrabold">
                  The shop code brings people in
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  It is public, and it grants nothing of value — only a
                  membership and a <em>pending</em> welcome stamp. Photograph
                  it, share it, scan it on ten phones: every one of those
                  stamps is worth nothing until a person walks into your shop
                  and your staff confirm them.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-extrabold">
                  The customer&rsquo;s code earns
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Every real stamp, including the welcome one, is granted by
                  your staff scanning the customer&rsquo;s own code or finding
                  them by mobile number. Nobody stamps themselves, and a
                  cooldown you set stops a card being filled in one afternoon.
                </dd>
              </div>
            </dl>
            <p className="mt-6 border-t border-[var(--line)] pt-5 text-xs leading-relaxed text-[var(--muted)]">
              The welcome stamp is yours to switch off. A café gives one away
              gladly; a shop with a ₱3,000 average ticket may not want to, and
              does not have to.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-9">
            <p className="text-2xl font-extrabold leading-[1.15] tracking-[-0.02em]">
              Turn first-time buyers into regulars without slowing the queue.
            </p>
            <a
              href="/partners"
              className="focus-ring mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--ink)] transition hover:-translate-y-0.5"
            >
              Apply to join <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
