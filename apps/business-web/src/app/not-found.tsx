import { BrandMark } from "@stampr/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6 text-center">
      <div className="max-w-md">
        <BrandMark />
        <p className="mt-8 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Workspace 404</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em]">That business view is not here.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">Return to the dashboard to keep exploring the complete demo workspace.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[var(--ink)] px-6 text-sm font-bold text-[var(--paper)]">Back to dashboard</Link>
      </div>
    </main>
  );
}
