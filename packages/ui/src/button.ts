/**
 * The button look as plain class strings. No "use client": a server component
 * (a not-found page, a static link) can call `buttonClass` too.
 */

export type ButtonTone = "dark" | "accent" | "quiet" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const buttonTones: Record<ButtonTone, string> = {
  dark: "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink-soft)]",
  accent: "bg-[var(--accent)] text-[var(--ink)] hover:bg-[#d88c38]",
  quiet: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
  danger:
    "border border-[rgb(178_59_43/28%)] bg-[rgb(178_59_43/7%)] text-[var(--danger)] hover:bg-[rgb(178_59_43/12%)]",
  // For dark panels.
  ghost: "border border-white/20 bg-white/5 text-[var(--paper)] hover:bg-white/10",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-5 text-sm",
  // Lines up with the 48px form controls; for submits and buttons beside a field.
  lg: "min-h-12 px-6 text-sm",
};

/**
 * The button look as a class string, for a link that should look like a
 * button (`<Link className={buttonClass({ size: "lg" })}>`). The focus ring
 * comes from the shared base rule in tokens.css.
 */
export function buttonClass({ tone = "dark", size = "md" }: { tone?: ButtonTone; size?: ButtonSize } = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-bold transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${buttonSizes[size]} ${buttonTones[tone]}`;
}
