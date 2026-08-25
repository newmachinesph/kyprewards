import { BrandMark } from "@stampr/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="admin-grid grid min-h-[100dvh] place-items-center p-6 text-center">
      <div className="max-w-md">
        <BrandMark label="Stampr Platform" />
        <p className="mt-8 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent-strong)]">Control room 404</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">That platform view is not available.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">Return to the network overview and continue the operations demo.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-[var(--paper)]">Back to overview</Link>
      </div>
    </main>
  );
}
