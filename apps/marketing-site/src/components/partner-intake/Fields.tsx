"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * One labelled control.
 *
 * The hint sits under the label rather than under the input, so it is read
 * before the field is filled instead of after it is filled wrongly.
 */
export function Field({
  label,
  hint,
  error,
  optional = false,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-extrabold">
        {label}
        {/* Marking what is optional, not what is required. On a form where
            nearly everything is needed, a wall of red asterisks is noise;
            the two exceptions are the useful signal. */}
        {optional && (
          <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            optional
          </span>
        )}
      </label>
      {hint && (
        <p id={`${htmlFor}-hint`} className="-mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-bold text-[var(--danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "focus-ring min-h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-[15px] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)]";

export const inputInvalidClass =
  "focus-ring min-h-12 w-full rounded-2xl border-2 border-[var(--danger)] bg-[var(--paper)] px-4 text-[15px] outline-none transition placeholder:text-[var(--muted)]";

/**
 * A set of mutually exclusive answers, as buttons rather than a select.
 *
 * Three to five short options are faster to hit than a dropdown, and on a
 * phone they do not open a native picker over the rest of the form.
 */
export function ChipGroup({
  legend,
  hint,
  options,
  value,
  onChange,
  error,
  columns = "auto",
}: {
  legend: string;
  hint?: string;
  options: { value: string; label: string; detail?: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: "auto" | "two";
}) {
  return (
    <fieldset className="grid gap-2 border-0 p-0">
      <legend className="text-sm font-extrabold">{legend}</legend>
      {hint && (
        <p className="text-xs leading-relaxed text-[var(--muted-strong)]">{hint}</p>
      )}
      <div
        className={
          columns === "two"
            ? "mt-1 grid gap-2 sm:grid-cols-2"
            : "mt-1 flex flex-wrap gap-2"
        }
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`focus-ring rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/18%)]"
                  : "border-[var(--line-strong)] bg-[var(--paper)] hover:-translate-y-0.5 hover:border-[var(--ink)]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-extrabold">
                {active && <Check size={15} strokeWidth={3} />}
                {option.label}
              </span>
              {option.detail && (
                <span
                  className={`mt-1 block max-w-[34ch] text-xs leading-relaxed ${
                    active ? "text-white/70" : "text-[var(--muted-strong)]"
                  }`}
                >
                  {option.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs font-bold text-[var(--danger)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Shown only near the ceiling.
 *
 * A counter reading 0/120 before a single character is typed tells the
 * merchant nothing except that they are being measured.
 */
export function Remaining({ value, limit }: { value: string; limit: number }) {
  if (value.length < limit * 0.8) return null;
  const left = limit - value.length;
  return (
    <p
      aria-live="polite"
      className={`text-right text-xs font-bold ${left <= 0 ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}
    >
      {left} character{left === 1 ? "" : "s"} left
    </p>
  );
}
