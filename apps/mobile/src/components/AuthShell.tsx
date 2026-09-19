import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Croissant, Mail, Smartphone } from "lucide-react-native";
import { displayMobile, normalizeMobile, toE164 } from "@kypstamping/ui/format";
import { BrandMark } from "@/components/Brand";
import { Eyebrow } from "@/components/ui";
import { StampDots } from "@/components/StampDots";
import { useKeyboardInset } from "@/lib/keyboard";
import { colors } from "@/lib/theme";

/** Scrolls the sheet to whichever field just took focus. */
const RevealContext = createContext<() => void>(() => undefined);

/**
 * The sign-in frame: amber above with a card illustration, paper sheet below.
 *
 * The illustration is deliberately not a real shop's card - it says "Your
 * local favourite" over a streak the visitor does not have, and the web
 * wallet renamed it off the seeded bakery so nobody mistook it for their own.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const content = useRef<View>(null);
  const keyboard = useKeyboardInset();
  // Bring the field being typed into to just below the top of the screen.
  // This used to scroll to the end on every keyboard, which pushed the name
  // and number fields out of sight while you typed into them.
  const reveal = useCallback(() => {
    const focused = TextInput.State.currentlyFocusedInput();
    if (!Keyboard.isVisible() || !focused || !content.current) return;
    focused.measureLayout(
      content.current,
      (_x, y) =>
        scroller.current?.scrollTo({ y: Math.max(0, y - 96), animated: true }),
      () => undefined,
    );
  }, []);
  useEffect(() => {
    // A frame later, once the sheet has grown by the keyboard's height.
    if (keyboard > 0) requestAnimationFrame(reveal);
  }, [keyboard, reveal]);
  return (
    // With edge-to-edge (Android 15 and up, the SDK 57 default) the window
    // no longer resizes under a keyboard, and KeyboardAvoidingView did not
    // make room either; the sheet pads by the measured keyboard instead.
    <View className="flex-1 bg-accent">
      <ScrollView
        ref={scroller}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12 }}
      >
        <RevealContext.Provider value={reveal}>
        <View ref={content} className="flex-1">
        <View className="px-5">
          <BrandMark />
          <View className="mt-5 rounded-2xl bg-ink px-5 py-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <View className="size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Croissant size={19} color={colors.accent} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-sans-extrabold text-[14px] text-paper"
                  >
                    Your local favourite
                  </Text>
                  <Text className="mt-0.5 font-sans-semibold text-[10px] text-white/55">
                    Closest reward
                  </Text>
                </View>
              </View>
              <Text className="shrink-0 rounded-full bg-accent px-2.5 py-1 font-sans-extrabold text-[9px] uppercase tracking-[1px] text-ink">
                5-stamp streak
              </Text>
            </View>
            <View className="mt-5">
              <StampDots filled={5} total={8} ink={colors.paper} />
            </View>
            <View className="mt-3 flex-row justify-between">
              <Text className="font-sans-bold text-[10px] text-white/55">
                3 visits to go
              </Text>
              <Text className="font-sans-bold text-[10px] text-accent">
                Free pastry
              </Text>
            </View>
          </View>
        </View>
        <View
          className="mt-6 flex-1 rounded-t-[28px] bg-paper px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 28 + keyboard }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-line-strong" />
          <Eyebrow>{eyebrow}</Eyebrow>
          <Text className="mt-2 font-display text-[30px] leading-[34px] tracking-[-0.9px] text-ink">
            {title}
          </Text>
          <Text className="mt-2 font-sans text-[14px] leading-[21px] text-muted-strong">
            {description}
          </Text>
          <View className="mt-6 gap-5">{children}</View>
        </View>
        </View>
        </RevealContext.Provider>
      </ScrollView>
    </View>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  autoComplete,
  secure = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoComplete?:
    | "name"
    | "email"
    | "tel"
    | "one-time-code"
    | "current-password"
    | "new-password"
    | "off";
  secure?: boolean;
  hint?: string;
}) {
  const reveal = useContext(RevealContext);
  return (
    <View className="gap-2">
      {label ? (
        <Text className="font-sans-extrabold text-[12px] text-ink">{label}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={reveal}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        secureTextEntry={secure}
        accessibilityLabel={label || placeholder}
        className="min-h-[50px] rounded-2xl border border-line-strong bg-surface px-4 font-sans-semibold text-[15px] text-ink"
      />
      {hint ? (
        <Text className="font-sans-semibold text-[11px] text-muted-strong">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export type Channel = "mobile" | "email";

/** Mobile or email, on sign-in and sign-up alike. */
export function ChannelSwitch({
  value,
  onChange,
}: {
  value: Channel;
  onChange: (channel: Channel) => void;
}) {
  return (
    <View className="flex-row rounded-2xl border border-line bg-surface p-1">
      {(
        [
          ["mobile", "Mobile", Smartphone],
          ["email", "Email", Mail],
        ] as const
      ).map(([key, label, Icon]) => {
        const on = value === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(key)}
            className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-xl ${on ? "bg-ink" : ""}`}
          >
            <Icon size={15} color={on ? colors.paper : colors.mutedStrong} />
            <Text
              className={`font-sans-extrabold text-[13px] ${on ? "text-paper" : "text-muted-strong"}`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * A Philippine mobile number with +63 printed into the field: ten digits go
 * in, grouped as they are read aloud, and E.164 comes back out. Paste takes
 * `0917…`, `+63 917…` and `639…` alike.
 */
export function MobileField({
  value,
  onChange,
  label = "Mobile number",
}: {
  value: string;
  onChange: (e164: string) => void;
  label?: string;
}) {
  const reveal = useContext(RevealContext);
  const national = normalizeMobile(value);
  return (
    <View className="gap-2">
      <Text className="font-sans-extrabold text-[12px] text-ink">{label}</Text>
      <View className="min-h-[50px] flex-row items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4">
        <Text className="font-sans-bold text-[15px] text-muted-strong">
          +63
        </Text>
        <View className="h-5 w-px bg-line-strong" />
        <TextInput
          value={displayMobile(national)}
          onChangeText={(typed) => {
            const digits = normalizeMobile(typed);
            onChange(toE164(digits) || digits);
          }}
          onFocus={reveal}
          placeholder="917 555 0182"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          autoComplete="tel"
          accessibilityLabel={label}
          accessibilityHint="Ten digits, starting with 9"
          className="min-w-0 flex-1 py-3 font-sans-semibold text-[15px] text-ink"
        />
      </View>
    </View>
  );
}
