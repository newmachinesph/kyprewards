import { ArrowRight, QrCode, ScanLine, Smartphone, UserRoundCheck } from "lucide-react";
import { SiteEyebrow } from "@/components/MarketingUi";

/**
 * The onboarding story: value first, registration second.
 *
 * The whole section exists to make one distinction legible - the store QR is
 * how a stranger becomes a member, the customer's own QR is how a member
 * earns again. Confusing the two is what makes most loyalty apps feel slow at
 * a counter.
 */

const STEPS = [
  {
    icon: QrCode,
    label: "Scan the store code",
    body: "On the counter, on the receipt, on a sticker by the till. No app to download.",
  },
  {
    icon: ScanLine,
    label: "The first stamp lands",
    body: "Straight away, before anything is asked of them. This one is on the house — it is what buys their attention.",
  },
  {
    icon: Smartphone,
    label: "Register to keep it",
    body: "A mobile number, once, to save the stamp and carry it forward. They are agreeing to something they can already see.",
  },
  {
    icon: UserRoundCheck,
    label: "Every visit after",
    body: "Staff scan the customer's own code, or find them by mobile number. Seconds, not a queue.",
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
            stops being worth it, and the customer says no thanks. KYPStamping
            turns that around: the first stamp arrives in seconds, and the
            sign-up comes after, when there is already something to save.
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
          {/* The distinction the whole model rests on. Worth its own panel:
              a merchant who thinks the store QR keeps working has built a way
              for anyone to stamp themselves from the pavement. */}
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9">
            <SiteEyebrow>Two codes, two jobs</SiteEyebrow>
            <dl className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-extrabold">The store code brings people in</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  It is public, and it does exactly one thing: hand a first-time
                  customer their first stamp. It cannot be used to stack more —
                  one per person, per shop.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-extrabold">The customer&rsquo;s code earns</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Every visit after the first is authorised by your staff, by
                  scanning the customer&rsquo;s own code or finding them by mobile
                  number. Nobody stamps themselves.
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-9">
            <p className="text-2xl font-extrabold leading-[1.15] tracking-[-0.02em]">
              Turn first-time buyers into regulars without slowing the queue.
            </p>
            <a
              href="/partners"
              className="focus-ring mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--ink)] transition hover:-translate-y-0.5"
            >
              Start your program <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
