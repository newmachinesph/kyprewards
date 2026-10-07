import { Text, View } from "react-native";
import { History } from "lucide-react-native";
import { useConsentHistory } from "@kyprewards/api";
import { relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { EmptyState, Eyebrow, Panel, QueryState, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function Consent() {
  const consent = useConsentHistory();
  const rows = consent.data ?? [];
  return (
    <Screen title="Consent history" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Consent history</Title>
      <Panel className="mt-6">
        <History size={22} color={colors.accentStrong} />
        <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
          Every change, in order
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          Each entry records what changed, which business it applied to, and
          when it took effect.
        </Text>
      </Panel>
      <View className="mt-4">
        <QueryState
          isPending={consent.isPending}
          error={consent.error}
          onRetry={() => void consent.refetch()}
          label="your consent history"
        >
          {rows.length === 0 ? (
            <EmptyState title="No changes recorded yet." />
          ) : (
            <View className="border-y border-line">
              {rows.map((entry, index) => (
                <View
                  key={entry.id}
                  className={`flex-row gap-3 py-4 ${index > 0 ? "border-t border-line" : ""}`}
                >
                  <View className="mt-1.5 size-2 rounded-full bg-accent" />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-extrabold text-[14px] text-ink">
                      {entry.change}
                    </Text>
                    <Text className="mt-0.5 font-sans text-[10px] text-muted">
                      {entry.scope} · {relativeTime(entry.occurredAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </QueryState>
      </View>
    </Screen>
  );
}
