"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function PlaybookSignup() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(
      new FormData(event.currentTarget).get("email") ?? "",
    ).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        "Enter a valid work email so we know where to send the playbook.",
      );
      return;
    }

    setError("");
    setSent(true);
  }

  if (sent) {
    return (
      <div
        className="flex min-h-12 max-w-lg items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-sm font-bold"
        aria-live="polite"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent)]">
          <Check size={14} strokeWidth={3} />
        </span>
        Demo signup captured locally. No email was sent.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-lg" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="playbook-email">
          Work email
        </label>
        <input
          id="playbook-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Work email"
          aria-describedby={error ? "playbook-error" : undefined}
          className="focus-ring min-h-12 min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-5 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
        />
        <button
          type="submit"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(33_27_23/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] active:translate-y-0 active:scale-[0.98]"
        >
          Preview playbook signup <ArrowRight size={15} />
        </button>
      </div>
      {error && (
        <p
          id="playbook-error"
          className="mt-3 rounded-xl bg-[rgb(149_83_12/10%)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
