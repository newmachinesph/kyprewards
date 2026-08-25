"use client";

import { useEffect } from "react";
import { RotateCcw, Stamp } from "lucide-react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="site-grid grid min-h-[calc(100dvh-72px)] place-items-center px-4 py-20 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-[var(--ink)] text-[var(--accent)]">
          <Stamp />
        </span>
        <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          The page lost its place
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em]">
          This view did not load.
        </h1>
        <p className="mx-auto mt-4 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
          The rest of Stampr is still available. Try this page again before
          changing anything.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ink)] px-6 text-sm font-bold text-[var(--paper)] transition active:scale-[0.98]"
        >
          <RotateCcw size={16} /> Try again
        </button>
      </div>
    </main>
  );
}
