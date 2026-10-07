"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { IconButton } from "@kyprewards/ui";

/** A full-height panel over the wallet, the way every sheet here opens. */
export function SheetFrame({
  title,
  labelledBy,
  close,
  children,
}: {
  title: string;
  labelledBy: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-[55] overflow-y-auto bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <SheetHeader title={title} close={close} />
      {children}
    </div>
  );
}

export function SheetHeader({ title, close }: { title: string; close: () => void }) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Focus lands on the sheet, and returns to whatever opened it on close.
    const opener = document.activeElement as HTMLElement | null;
    backRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [close]);
  return (
    <header className="sticky top-0 z-10 flex h-17 items-center justify-between border-b border-[var(--line)] bg-[rgb(250_248_243/94%)] px-5 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <IconButton ref={backRef} onClick={close} label={`Close ${title}`}>
        <ArrowLeft size={18} />
      </IconButton>
      <p className="text-sm font-extrabold">{title}</p>
      <IconButton onClick={close} label="Close">
        <X size={18} />
      </IconButton>
    </header>
  );
}
