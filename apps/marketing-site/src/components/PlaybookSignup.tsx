"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { ApiError, requestPlaybook } from "@kypstamping/api";

export function PlaybookSignup() {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
    setSending(true);
    try {
      await requestPlaybook(email);
      setSent(true);
    } catch (failure) {
      // 429 is the throttle, and its message already says what to do.
      setError(
        failure instanceof ApiError
          ? failure.message
          : "That did not send. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
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
        On its way. Check your inbox for the playbook.
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
          disabled={sending}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
        >
          {sending ? (
            <>
              Sending <LoaderCircle size={15} className="animate-spin" />
            </>
          ) : (
            <>
              Send me the playbook <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
      {error && (
        <p
          id="playbook-error"
          className="mt-3 rounded-xl bg-[rgb(143_85_16/10%)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
