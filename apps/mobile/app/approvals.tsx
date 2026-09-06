import { Text, View } from "react-native";
import { Gift } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  approveRedemption,
  declineRedemption,
  keys,
  useApiMutation,
  usePendingApprovals,
  type PendingApproval,
} from "@kypstamping/api";
import {
  pesoFromCentavos,
  relativeTime,
  timeOfDay,
} from "@kypstamping/ui/format";
import { Screen } from "@/components/Screen";
import {
  Button,
  EmptyState,
  Eyebrow,
  Lede,
  Panel,
  QueryState,
  Title,
} from "@/components/ui";
import { colors } from "@/lib/theme";

/**
 * A reward the counter has reserved and is waiting on.
 *
 * The customer's tap is what releases it: staff see the approval on their
 * side and hand the reward over. Declining cancels the reserve and the
 * reward stays held on the card.
 */
export default function Approvals() {
  const approvals = usePendingApprovals();
  const rows = approvals.data ?? [];
  return (
    <Screen title="Approve a reward" back bottom={48}>
      <Eyebrow>At the counter</Eyebrow>
      <Title>Waiting for you</Title>
      <Lede>Your approval releases the reward at the counter.</Lede>
      <View className="mt-6 gap-3">
        <QueryState
          isPending={approvals.isPending}
          error={approvals.error}
          onRetry={() => void approvals.refetch()}
          label="rewards waiting for approval"
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={<Gift size={22} color={colors.muted} />}
              title="Nothing waiting."
              detail="When staff reserve a reward for you, it appears here for one tap."
            />
          ) : (
            rows.map((row) => <ApprovalRow key={row.id} row={row} />)
          )}
        </QueryState>
      </View>
    </Screen>
  );
}

function ApprovalRow({ row }: { row: PendingApproval }) {
  const invalidates = [
    keys.wallet.approvals(),
    keys.customer.wallet(),
    keys.customer.activity(),
  ];
  const approve = useApiMutation(approveRedemption, {
    invalidates,
    onSuccess: () =>
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  });
  const decline = useApiMutation(declineRedemption, { invalidates });
  const busy = approve.isPending || decline.isPending;
  const failure = approve.error ?? decline.error;

  return (
    <Panel>
      <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent-strong">
        {row.business}
      </Text>
      <Text className="mt-1 font-sans-extrabold text-[18px] tracking-[-0.4px] text-ink">
        {row.reward}
      </Text>
      <Text className="mt-1 font-sans text-[12px] text-muted-strong">
        Worth {pesoFromCentavos(row.valueCentavos)} · {row.branch} · {row.staff}
      </Text>
      <Text className="mt-1 font-sans text-[11px] text-muted">
        Asked {relativeTime(row.requestedAt)} · the counter holds it until{" "}
        {timeOfDay(row.expiresAt)}
      </Text>
      {approve.isSuccess ? (
        <Text className="mt-4 font-sans-bold text-[12px] text-success">
          Approved. Staff can hand it over now.
        </Text>
      ) : decline.isSuccess ? (
        <Text className="mt-4 font-sans-bold text-[12px] text-muted-strong">
          Declined. The reward stays on your card.
        </Text>
      ) : (
        <View className="mt-4 flex-row gap-2">
          <View className="flex-1">
            <Button
              tone="quiet"
              busy={decline.isPending}
              disabled={busy}
              onPress={() => decline.mutate(row.id)}
            >
              Decline
            </Button>
          </View>
          <View className="flex-1">
            <Button
              busy={approve.isPending}
              disabled={busy}
              onPress={() => approve.mutate(row.id)}
            >
              Approve
            </Button>
          </View>
        </View>
      )}
      {failure ? (
        <Text
          accessibilityRole="alert"
          className="mt-2 font-sans-bold text-[11px] text-danger"
        >
          {failure.message}
        </Text>
      ) : null}
    </Panel>
  );
}
