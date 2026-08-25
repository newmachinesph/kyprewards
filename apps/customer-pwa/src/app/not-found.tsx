import { BrandMark } from "@stampr/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-[460px] place-items-center bg-[var(--paper)] p-7 text-center phone-shell">
      <div>
        <BrandMark compact />
        <p className="mt-8 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Wallet 404</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em]">This reward path wandered off.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">Your wallet is still intact. Head home to continue the customer demo.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[var(--ink)] px-6 text-sm font-bold text-[var(--paper)]">Back to wallet</Link>
      </div>
    </main>
  );
}
