import Link from "next/link";
import { BrandMark } from "@stampr/ui";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-[460px] place-items-center bg-[var(--paper)] p-7 text-center phone-shell">
      <div>
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <span className="mx-auto mt-12 grid size-14 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted-strong)]">
          <WifiOff />
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
          You are offline.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          Reconnect to refresh cards or use your secure QR code.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-[var(--paper)] transition active:scale-[0.98]">
          Try again
        </Link>
      </div>
    </main>
  );
}
