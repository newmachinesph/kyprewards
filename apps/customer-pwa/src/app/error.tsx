"use client";

import { useEffect } from "react";
import { Button } from "@stampr/ui";
import { Heart } from "lucide-react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-[460px] place-items-center bg-[var(--paper)] p-7 text-center phone-shell">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[rgb(178_59_43/12%)] text-[var(--danger)]">
          <Heart />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
          Your cards did not load.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          Your stamps are safe. Reconnect and try refreshing this view.
        </p>
        <Button className="mt-6" onClick={retry}>
          Refresh cards
        </Button>
      </div>
    </main>
  );
}
