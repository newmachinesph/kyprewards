import { useEffect } from "react";
import { Text, View } from "react-native";
import { create } from "zustand";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * One line of feedback, from anywhere, without threading a callback through
 * every screen. `notify("Approved.")` and it shows for three seconds.
 */
type ToastState = {
  message: string;
  tone: "success" | "error";
  shownAt: number;
  notify: (message: string, tone?: "success" | "error") => void;
  clear: () => void;
};

export const useToast = create<ToastState>()((set) => ({
  message: "",
  tone: "success",
  shownAt: 0,
  notify: (message, tone = "success") =>
    set({ message, tone, shownAt: Date.now() }),
  clear: () => set({ message: "" }),
}));

export const notify = (
  message: string,
  tone: "success" | "error" = "success",
) => useToast.getState().notify(message, tone);

export function ToastHost() {
  const { message, tone, shownAt, clear } = useToast();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 3200);
    return () => clearTimeout(timer);
  }, [message, shownAt, clear]);
  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      className="absolute inset-x-5 items-center"
      style={{ bottom: 92 + insets.bottom }}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${tone === "error" ? "bg-danger" : "bg-ink"}`}
      >
        <Text className="font-sans-bold text-[13px] text-paper">{message}</Text>
      </View>
    </View>
  );
}
