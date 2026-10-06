"use client";

/**
 * Form controls shared by every app.
 *
 * One scale for every control: 48px tall, 12px radius, 16px text. Sixteen
 * pixels is not a style choice - iOS Safari zooms the page whenever a focused
 * control's text is smaller, at any screen width. Before this file each app
 * styled its own inputs, and a global rule in one of them made the email box
 * taller than the mobile and password boxes on the same sign-in form.
 *
 * `className` goes on the outermost element and is for layout only (max
 * width, grid span, font-mono, tracking, text alignment). It must not set
 * width, height, padding or colour: without tailwind-merge, which of two
 * utilities for the same property wins is not something a caller controls.
 */

import { createContext, use, useId, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { displayMobile, normalizeMobile } from "./format";

export type Surface = "light" | "dark";

const control = {
  // outline-hidden, not outline-none: it keeps a visible outline in Windows
  // high-contrast mode, where the box-shadow ring below is dropped. Invalid
  // sets colour only, so focus still visibly changes an invalid field.
  base: "min-h-12 w-full min-w-0 rounded-xl border px-4 text-base font-normal outline-hidden transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-[var(--danger)]",
  light:
    "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)] focus:ring-1 focus:ring-[var(--accent-strong)]",
  dark: "border-white/15 bg-[var(--ink-soft)] text-[var(--paper)] placeholder:text-white/55 [color-scheme:dark] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]",
};

type FieldState = { id: string; describedBy?: string; invalid: boolean; surface?: Surface };
const FieldContext = createContext<FieldState | null>(null);

const join = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

/**
 * What a control inside a Field gets: the Field's id (so the label points at
 * it), its hint and error ids merged with the caller's own describedby, and
 * invalid when the Field has an error.
 */
function useControl(props: {
  id?: string;
  surface?: Surface;
  "aria-describedby"?: string;
  "aria-invalid"?: ComponentProps<"input">["aria-invalid"];
}) {
  const field = use(FieldContext);
  const surface = props.surface ?? field?.surface ?? "light";
  return {
    surface,
    dark: surface === "dark",
    classes: `${control.base} ${control[surface]}`,
    aria: {
      id: field ? field.id : props.id,
      "aria-describedby": join(field?.describedBy, props["aria-describedby"]),
      "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    },
  };
}

/** A label, one control, and its hint and error, wired by id. */
export function Field({
  label,
  hint,
  error,
  surface,
  id,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  surface?: Surface;
  /** Only when something outside needs to point at the control. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const dark = surface === "dark";
  return (
    // content-start: in a row of fields stretched to one height, the spare
    // height goes below the hint, so inputs side by side stay level.
    <div className={`grid content-start gap-2 ${className}`}>
      <label htmlFor={controlId} className="text-xs font-extrabold">
        {label}
      </label>
      <FieldContext
        value={{ id: controlId, describedBy: join(hint ? hintId : null, error ? errorId : null), invalid: !!error, surface }}
      >
        {children}
      </FieldContext>
      {hint ? (
        <p id={hintId} className={`text-xs leading-relaxed ${dark ? "text-white/60" : "text-[var(--muted-strong)]"}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={`text-xs font-bold ${dark ? "text-[var(--danger-on-dark)]" : "text-[var(--danger)]"}`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Read-only is shown by tone, not by opacity on the caller's className.
// Not Tailwind's `read-only:` variant: `:read-only` matches every select and
// every disabled input too.
const readOnlyCue = {
  light: "[&[readonly]]:bg-[var(--surface-2)] [&[readonly]]:text-[var(--muted-strong)]",
  dark: "[&[readonly]]:bg-white/5 [&[readonly]]:text-white/60",
};

type InputProps = ComponentProps<"input"> & { surface?: Surface; icon?: ReactNode };

export function Input({ surface, icon, className = "", id, ...props }: InputProps) {
  const c = useControl({ ...props, id, surface });
  if (!icon) {
    return <input {...props} {...c.aria} className={`${c.classes} ${readOnlyCue[c.surface]} ${className}`} />;
  }
  return (
    <span className={`relative block ${className}`}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${c.dark ? "text-white/60" : "text-[var(--muted)]"}`}
      >
        {icon}
      </span>
      <input {...props} {...c.aria} className={`${c.classes} ${readOnlyCue[c.surface]} pl-11`} />
    </span>
  );
}

export function PasswordInput({ surface, className = "", id, ...props }: Omit<InputProps, "type" | "icon">) {
  const [visible, setVisible] = useState(false);
  const c = useControl({ ...props, id, surface });
  return (
    <span className={`relative block ${className}`}>
      <input {...props} {...c.aria} type={visible ? "text" : "password"} className={`${c.classes} pr-12`} />
      <button
        type="button"
        disabled={props.disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((shown) => !shown)}
        className={`absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl disabled:opacity-45 ${c.dark ? "text-white/70 hover:text-white" : "text-[var(--muted-strong)] hover:text-[var(--ink)]"}`}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}

/**
 * A Philippine mobile number with +63 printed in the field.
 *
 * Takes and gives the ten national digits; callers convert with `toE164`.
 * Paste works in every spelling (`0917…`, `+63 917…`, `639…`).
 */
export function MobileInput({
  value,
  onValueChange,
  surface,
  className = "",
  id,
  ...props
}: Omit<InputProps, "type" | "value" | "onChange" | "icon"> & {
  value: string;
  onValueChange: (national: string) => void;
}) {
  const hintId = useId();
  const c = useControl({ ...props, id, surface });
  return (
    <span className={`relative block ${className}`}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-4 flex items-center gap-3 text-base font-bold ${c.dark ? "text-white/70" : "text-[var(--muted-strong)]"}`}
      >
        +63
        <span className={`h-5 w-px ${c.dark ? "bg-white/20" : "bg-[var(--line-strong)]"}`} />
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        {...props}
        {...c.aria}
        aria-describedby={join(c.aria["aria-describedby"], hintId)}
        value={displayMobile(normalizeMobile(value))}
        onChange={(event) => onValueChange(normalizeMobile(event.target.value))}
        className={`${c.classes} pl-[4.75rem]`}
      />
      {/* For a screen reader, which gets neither the decorative +63 nor the
          placeholder as a description. */}
      <span id={hintId} className="sr-only">
        Ten digits, starting with 9.
      </span>
    </span>
  );
}

export function Select({ surface, className = "", id, ...props }: ComponentProps<"select"> & { surface?: Surface }) {
  const c = useControl({ ...props, id, surface });
  return (
    <span className={`relative block ${className}`}>
      <select {...props} {...c.aria} className={`${c.classes} appearance-none pr-11`} />
      <ChevronDown
        aria-hidden="true"
        size={18}
        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${c.dark ? "text-white/60" : "text-[var(--muted-strong)]"}`}
      />
    </span>
  );
}

export function Textarea({ surface, className = "", id, ...props }: ComponentProps<"textarea"> & { surface?: Surface }) {
  const c = useControl({ ...props, id, surface });
  return <textarea {...props} {...c.aria} className={`${c.classes} ${readOnlyCue[c.surface]} resize-y py-3 leading-relaxed ${className}`} />;
}

/** The box only; the caller keeps its row layout and label. */
export function Checkbox({ surface, className = "", ...props }: Omit<ComponentProps<"input">, "type"> & { surface?: Surface }) {
  const dark = (surface ?? use(FieldContext)?.surface) === "dark";
  return (
    <input
      {...props}
      type="checkbox"
      className={`size-5 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${dark ? "accent-[var(--accent)]" : "accent-[var(--ink)]"} ${className}`}
    />
  );
}

type SwitchName = { "aria-labelledby": string; "aria-label"?: never } | { "aria-label": string; "aria-labelledby"?: never };

/** An on/off switch. It must be named: point it at the visible title. */
export function Switch({
  checked,
  onCheckedChange,
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "onChange" | "role" | "aria-checked" | "children" | "aria-label" | "aria-labelledby"> &
  SwitchName & { checked: boolean; onCheckedChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      {...props}
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        props.onClick?.(event);
        onCheckedChange(!checked);
      }}
      // The before: element widens the tap target without moving layout.
      className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors before:absolute before:-inset-x-2 before:-inset-y-2.5 disabled:cursor-not-allowed disabled:opacity-45 ${checked ? "bg-[var(--success)]" : "bg-[var(--muted)]"} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 size-4 rounded-full bg-[var(--surface)] shadow-sm transition-[left] ${checked ? "left-5" : "left-1"}`}
      />
    </button>
  );
}

/** A pressed/unpressed filter pill. Wrap a row of them in role="group". */
export function Chip({
  pressed,
  surface = "light",
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "aria-pressed"> & { pressed: boolean; surface?: Surface }) {
  const tone =
    surface === "dark"
      ? pressed
        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
        : "border-white/15 text-white/70 hover:bg-white/10"
      : pressed
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
        : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted-strong)] hover:border-[var(--ink)] hover:text-[var(--ink)]";
  return (
    <button
      type="button"
      {...props}
      aria-pressed={pressed}
      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45 ${tone} ${className}`}
    />
  );
}

/** Two to four mutually exclusive options shown side by side. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  surface = "light",
  className = "",
}: {
  label: string;
  options: readonly { value: T; label: ReactNode; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  surface?: Surface;
  className?: string;
}) {
  const dark = surface === "dark";
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col rounded-xl border p-1 ${dark ? "border-white/15 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"} ${className}`}
    >
      {options.map((option) => {
        const on = option.value === value;
        const tone = dark
          ? on
            ? "bg-[var(--accent)] text-[var(--ink)]"
            : "text-white/70 hover:text-white"
          : on
            ? "bg-[var(--ink)] text-[var(--paper)] shadow-sm"
            : "text-[var(--muted-strong)] hover:text-[var(--ink)]";
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-extrabold transition ${tone}`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * An inline result line. Always rendered and always role="status": a live
 * region that appears, or changes role, is not reliably announced. Empty, it
 * is visually hidden but stays in the accessibility tree.
 */
export function FormMessage({
  tone = "info",
  surface = "light",
  id,
  className = "",
  children,
}: {
  tone?: "error" | "success" | "info";
  surface?: Surface;
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  const colour =
    surface === "dark"
      ? { error: "text-[var(--danger-on-dark)]", success: "text-[var(--accent)]", info: "text-white/60" }[tone]
      : { error: "text-[var(--danger)]", success: "text-[var(--success)]", info: "text-[var(--muted-strong)]" }[tone];
  return (
    <p id={id} role="status" className={`text-xs font-bold empty:sr-only ${colour} ${className}`}>
      {children}
    </p>
  );
}
