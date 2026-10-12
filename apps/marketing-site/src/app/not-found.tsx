import Link from "next/link";
import { ArrowLeft, Stamp } from "lucide-react";

export default function NotFound() {
  return (
    <main className="site-canvas grid min-h-[calc(100dvh-72px)] place-items-center px-4 py-20 text-center">
      <div>
        <span className="ink-stamp mx-auto grid size-24 -rotate-6 place-items-center rounded-full bg-[var(--surface)] text-[var(--accent-strong)]">
          <span>
            <Stamp className="mx-auto" size={22} />
            <span className="mt-1 block font-mono text-[10px] font-extrabold">
              404
            </span>
          </span>
        </span>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          No stamp at this address
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">
          This page doesn’t exist.
        </h1>
        <p className="mx-auto mt-4 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
          The link may have moved, or part of the address is missing.
        </p>
        <Link
          href="/"
          className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ink)] px-6 text-sm font-bold text-[var(--paper)] transition active:scale-[0.98]"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>
    </main>
  );
}
