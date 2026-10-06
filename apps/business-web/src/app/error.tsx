"use client";

import { useEffect } from "react";
import { captureError } from "@kypstamping/ui/sentry";
import { Button } from "@kypstamping/ui";
import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    captureError(error);
  }, [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[rgb(178_59_43/12%)] text-[var(--danger)]">
          <CircleAlert />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
          The dashboard did not load.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
          Your data is safe. Check the connection and try loading this view
          again.
        </p>
        <Button className="mt-6" onClick={retry} icon={<RotateCcw size={16} />}>
          Try again
        </Button>
      </div>
    </main>
  );
}
