"use client";

import { useEffect } from "react";
import { Button } from "@kypstamping/ui";
import { PageIntro } from "@/components/Ui";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <PageIntro
      eyebrow="Something broke"
      title="That page did not load"
      description="Nothing of yours was touched. Try again, or head back to the directory."
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={retry}>Try again</Button>
      </div>
      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-[var(--muted)]">Reference {error.digest}</p>
      )}
    </PageIntro>
  );
}
