import { useState } from "react";
import { Text, View } from "react-native";
import { History, ShieldCheck } from "lucide-react-native";
import { useActivity } from "@kyprewards/api";
import { relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import {
  Chip,
  EmptyState,
  Eyebrow,
  Lede,
  QueryState,
  Title,
} from "@/components/ui";
import { colors } from "@/lib/theme";

export default function Activity() {
  const activity = useActivity();
  const rows = activity.data ?? [];
  const [filter, setFilter] = useState<"All" | "Earned" | "Used">("All");
  const visible = rows.filter((entry) =>
    filter === "All"
      ? true
      : filter === "Earned"
        ? entry.value.startsWith("+")
        : !entry.value.startsWith("+"),
  );

  return (
    <Screen title="Activity" back bottom={48}>
      <Eyebrow>Your loyalty ledger</Eyebrow>
      <Title>Every change, explained.</Title>
      <Lede>
        Earns, redemptions, and membership use stay traceable across every
        business in your wallet.
      </Lede>
      <View className="mt-6 flex-row gap-2">
        {(["All", "Earned", "Used"] as const).map((item) => (
          <Chip
            key={item}
            label={item}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>
      <View className="mt-6">
        <QueryState
          isPending={activity.isPending}
          error={activity.error}
          onRetry={() => void activity.refetch()}
          label="your activity"
        >
          {visible.length === 0 ? (
            <EmptyState
              title={
                filter === "All"
                  ? "No activity yet."
                  : `Nothing ${filter.toLowerCase()} yet.`
              }
              detail={
                filter === "All"
                  ? "Your first stamp will appear here."
                  : undefined
              }
            />
          ) : (
            <View className="border-y border-line">
              {visible.map((entry, index) => (
                <View
                  key={entry.id}
                  className={`flex-row items-center gap-3 py-5 ${index > 0 ? "border-t border-line" : ""}`}
                >
                  <View className="size-11 items-center justify-center rounded-2xl bg-surface-2">
                    <History size={18} color={colors.ink} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-extrabold text-[14px] text-ink">
                      {entry.action}
                    </Text>
                    <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[0.8px] text-accent-strong">
                      {entry.business} · {relativeTime(entry.occurredAt)}
                    </Text>
                    <Text className="mt-1 font-sans text-[11px] text-muted">
                      {entry.detail}
                    </Text>
                    <Text className="mt-2 font-mono text-[9px] text-muted-strong">
                      {entry.reference}
                    </Text>
                  </View>
                  <Text
                    className={`font-sans-extrabold text-[12px] ${entry.value.startsWith("+") ? "text-success" : "text-ink"}`}
                  >
                    {entry.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </QueryState>
      </View>
      <View className="mt-5 flex-row items-start gap-3 rounded-2xl bg-success/10 p-4">
        <ShieldCheck size={18} color={colors.success} />
        <Text className="flex-1 font-sans text-[12px] leading-[18px] text-muted-strong">
          Businesses cannot rewrite history. Refunds, reversals, and adjustments
          appear as new entries so your balance always has a clear reason.
        </Text>
      </View>
    </Screen>
  );
}
