import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * The handful of pieces every screen is built from, in the wallet's own
 * vocabulary. Small on purpose: a screen that needs something not here
 * writes it in place, and the second screen that needs the same thing
 * moves it here.
 */

export function Eyebrow({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <Text
      className={`font-sans-extrabold text-[11px] uppercase tracking-[1.6px] ${inverse ? "text-accent" : "text-accent-strong"}`}
    >
      {children}
    </Text>
  );
}

export function Title({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <Text
      className={`mt-2 font-display text-[30px] leading-[34px] tracking-[-0.9px] ${inverse ? "text-paper" : "text-ink"}`}
    >
      {children}
    </Text>
  );
}

export function Lede({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <Text
      className={`mt-2 font-sans text-[14px] leading-[21px] ${inverse ? "text-white/65" : "text-muted-strong"}`}
    >
      {children}
    </Text>
  );
}

type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  tone?: "dark" | "accent" | "quiet" | "danger";
  icon?: ReactNode;
  busy?: boolean;
  full?: boolean;
};

export function Button({
  children,
  tone = "dark",
  icon,
  busy = false,
  full = true,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const tones = {
    dark: "bg-ink",
    accent: "bg-accent",
    quiet: "border border-line-strong bg-surface",
    danger: "bg-danger",
  };
  const inks = {
    dark: "text-paper",
    accent: "text-ink",
    quiet: "text-ink",
    danger: "text-white",
  };
  const off = disabled || busy;
  // Android builds the content description from the label plus "busy", and
  // with no label it never rebuilds it: "busy" stayed after the work ended.
  // The text is the label; busy stays a state.
  const words = [children].flat();
  const label = words.every((w) => typeof w === "string" || typeof w === "number")
    ? words.join("")
    : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(off), busy }}
      disabled={off}
      className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-80 ${tones[tone]} ${full ? "w-full" : ""} ${off ? "opacity-50" : ""} ${className ?? ""}`}
      {...props}
    >
      {busy ? (
        <ActivityIndicator
          color={
            tone === "dark" || tone === "danger" ? colors.paper : colors.ink
          }
        />
      ) : (
        icon
      )}
      <Text className={`font-sans-extrabold text-[14px] ${inks[tone]}`}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-[36px] justify-center rounded-full px-4 ${selected ? "bg-ink" : "bg-surface-2"}`}
    >
      <Text
        className={`font-sans-bold text-[12px] ${selected ? "text-paper" : "text-muted-strong"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Switch({
  on,
  onToggle,
  label,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={onToggle}
      className={`h-7 w-12 justify-center rounded-full px-1 ${on ? "bg-success" : "bg-line-strong"} ${disabled ? "opacity-45" : ""}`}
    >
      <View
        className={`size-5 rounded-full bg-white ${on ? "self-end" : "self-start"}`}
      />
    </Pressable>
  );
}

/** A bordered white panel. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-line bg-surface p-5 ${className ?? ""}`}
    >
      {children}
    </View>
  );
}

/** A row that goes somewhere: icon, label, detail, chevron. */
export function Row({
  icon,
  label,
  detail,
  onPress,
  first = false,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  onPress?: () => void;
  first?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-3 p-4 active:bg-surface-2 ${first ? "" : "border-t border-line"}`}
    >
      <View className="size-10 items-center justify-center rounded-2xl bg-surface-2">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-extrabold text-[14px] text-ink">
          {label}
        </Text>
        {detail ? (
          <Text className="mt-0.5 font-sans text-[11px] text-muted">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? <ChevronRight size={16} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon?: ReactNode;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-line-strong p-7">
      {icon}
      <Text className="mt-3 text-center font-sans-extrabold text-[14px] text-ink">
        {title}
      </Text>
      {detail ? (
        <Text className="mt-1 max-w-[30ch] text-center font-sans text-[12px] leading-[18px] text-muted">
          {detail}
        </Text>
      ) : null}
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}

/**
 * Loading and failure, in one place, so no screen says "0 cards" while the
 * request is still in flight - the one thing that reads as "it did not work"
 * to a person holding a phone at a counter.
 */
export function QueryState({
  isPending,
  error,
  onRetry,
  label,
  children,
}: {
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  label: string;
  children: ReactNode;
}) {
  if (isPending) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.mutedStrong} />
        <Text className="mt-3 font-sans-semibold text-[12px] text-muted">
          Loading {label}…
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <Text className="font-sans-extrabold text-[14px] text-ink">
          Could not load {label}.
        </Text>
        <Text className="mt-1 font-sans text-[12px] text-muted-strong">
          {error.message}
        </Text>
        <Button tone="quiet" onPress={onRetry} className="mt-4">
          Try again
        </Button>
      </View>
    );
  }
  return <>{children}</>;
}

export function Notice({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: "success" | "muted";
}) {
  return (
    <View
      className={`rounded-2xl p-4 ${tone === "success" ? "bg-success/10" : "border border-dashed border-line-strong"}`}
    >
      <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
        {children}
      </Text>
    </View>
  );
}

/** A definition list row: term left, detail right. */
export function Term({
  term,
  detail,
  first = false,
}: {
  term: string;
  detail: string;
  first?: boolean;
}) {
  return (
    <View
      className={`flex-row items-baseline justify-between gap-4 py-2 ${first ? "" : "border-t border-line"}`}
    >
      <Text className="shrink-0 font-sans text-[12px] text-muted-strong">
        {term}
      </Text>
      <Text className="flex-1 text-right font-sans-bold text-[12px] text-ink">
        {detail}
      </Text>
    </View>
  );
}
