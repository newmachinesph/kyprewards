import { ArrowRight, MapPin, Sparkles, Wallet } from "lucide-react";
import { customerAppUrl, merchantSiteUrl } from "@/lib/site";

/**
 * kyp.ph, before the marketplace exists.
 *
 * Deliberately not a directory of shops yet: there is nothing to list that
 * would be true, and a marketplace showing invented merchants is the same
 * mistake as a dashboard showing invented customers. What it does have is the
 * one working door - the wallet at app.kyp.ph - so somebody who lands here
 * from a counter poster is not stranded on a page that only says "soon".
 */
export default function ComingSoon() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[880px] flex-col px-6 py-10 sm:px-8">
      <header className="flex items-center gap-2">
        <span className="text-xl font-extrabold tracking-[-0.03em]">
          <span className="text-[var(--accent-strong)]">KYP</span>
        </span>
        <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
          Coming soon
        </span>
      </header>

      <section className="my-auto py-16">
        <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Metro Manila
        </p>
        <h1 className="mt-5 max-w-[16ch] text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
          Rewards from the shops around you.
        </h1>
        <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
          One card for every shop you already visit — the cafe by the office,
          the salon near home, the bakery you stop at on Sundays. No separate
          app for each one, and no plastic to lose.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href={`${customerAppUrl}/login`}
            className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--paper)] transition hover:-translate-y-0.5"
          >
            Open my wallet <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a
            href={merchantSiteUrl}
            className="focus-ring inline-flex min-h-12 items-center rounded-xl border border-[var(--line-strong)] px-6 text-sm font-extrabold transition hover:bg-[var(--surface-2)]"
          >
            I run a shop
          </a>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
          {[
            { icon: Wallet, title: "One card", detail: "Every shop you have joined, in one place." },
            { icon: MapPin, title: "Nearby first", detail: "Find the ones close enough to walk to." },
            { icon: Sparkles, title: "Nothing to install", detail: "It runs in your browser." },
          ].map(({ icon: Icon, title, detail }) => (
            <li key={title} className="bg-[var(--surface)] p-6">
              <Icon size={18} className="text-[var(--accent-strong)]" aria-hidden="true" />
              <p className="mt-3 text-sm font-extrabold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">{detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
        <p>
          KYP is operated by KYPStamping.{" "}
          <a href={`${merchantSiteUrl}/privacy`} className="font-bold underline underline-offset-2">
            Privacy
          </a>{" "}
          &middot;{" "}
          <a href={`${merchantSiteUrl}/terms`} className="font-bold underline underline-offset-2">
            Terms
          </a>
        </p>
      </footer>
    </main>
  );
}
