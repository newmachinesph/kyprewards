"use client";

import { useEffect } from "react";
import { Button } from "@stampr/ui";
import { ShieldAlert } from "lucide-react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[rgb(216_86_65/12%)] text-[var(--danger)]">
          <ShieldAlert />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
          Platform data is temporarily unavailable.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          The incident was logged. Retry this view before opening an operations
          case.
        </p>
        <Button className="mt-6" onClick={retry}>
          Reload overview
        </Button>
      </div>
    </main>
  );
}
