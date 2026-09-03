"use client";

import { FormEvent, useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";
import { ApiError, submitContact } from "@kypstamping/api";
import { businessCategories } from "@/lib/content";

type FormState = "idle" | "sending" | "sent";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const businessName = String(data.get("business") ?? "").trim();
    if (!name || !email || !businessName) {
      setError(
        "Add your name, email, and business name so we know how to reach you.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email so we can reply.");
      return;
    }
    setError("");
    setState("sending");
    try {
      // The endpoint has no field for the business type, so the dropdown's
      // value was being dropped on the floor. It rides at the top of the
      // message instead — the person reading the inbox sees it first, and
      // nothing on the backend has to change.
      const type = String(data.get("type") ?? "").trim();
      const message = String(data.get("message") ?? "").trim();
      await submitContact({
        name,
        email,
        business: businessName,
        message: type ? `Business type: ${type}\n\n${message}` : message,
      });
      setState("sent");
    } catch (failure) {
      // 429 is the per-address throttle; its message already says what to do.
      setError(
        failure instanceof ApiError
          ? failure.message
          : "That did not send. Check your connection and try again.",
      );
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div
        className="grid min-h-[580px] place-items-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-8 text-center"
        aria-live="polite"
      >
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--accent)]">
            <Check size={24} strokeWidth={3} />
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.02em]">
Message sent.
          </h2>
          <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            We have it, and a copy is in your inbox. We reply the same working
            day where we can, and never later than the next.
          </p>
          <button
            onClick={() => setState("idle")}
            className="focus-ring mt-7 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold"
          >
Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          Your name
          <input
            name="name"
            autoComplete="name"
            required
            aria-describedby={error ? "contact-error" : undefined}
            className="focus-ring min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 font-normal outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
            placeholder="How should we address you?"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={error ? "contact-error" : undefined}
            className="focus-ring min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 font-normal outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
            placeholder="you@business.com"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Business name
          <input
            name="business"
            autoComplete="organization"
            required
            aria-describedby={error ? "contact-error" : undefined}
            className="focus-ring min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 font-normal outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
            placeholder="Your place"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Business type
          <select
            name="type"
            className="focus-ring min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 font-normal outline-none transition focus:border-[var(--accent-strong)]"
          >
            {businessCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          What can we help with?
          <textarea
            name="message"
            rows={5}
            className="focus-ring resize-y rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3 font-normal leading-relaxed outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]"
            placeholder="Tell us how customers return today, what you have tried, and where the experience breaks down."
          />
        </label>
      </div>
      {error && (
        <p
          id="contact-error"
          className="mt-4 rounded-2xl bg-[rgb(143_85_16/10%)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[46ch] text-[11px] leading-relaxed text-[var(--muted)]">
          By contacting us, you agree that KYP Stamping may respond about your
          inquiry. We do not add you to marketing lists without permission.
        </p>
        <button
          type="submit"
          disabled={state === "sending"}
          className="focus-ring inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Preparing
            </>
          ) : (
            <>
              <Send size={16} /> Send message
            </>
          )}
        </button>
      </div>
    </form>
  );
}
