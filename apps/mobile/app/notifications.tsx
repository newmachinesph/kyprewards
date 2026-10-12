import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { BadgeCheck, Bell, ChevronRight } from "lucide-react-native";
import {
  keys,
  markNotificationsRead,
  useApiMutation,
  useNotifications,
  usePendingApprovals,
  useWallet,
  type CustomerNotification,
  type WalletCard,
} from "@kyprewards/api";
import { relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Lede, QueryState, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

/** Campaigns are the promotional kind; everything else is a service message. */
const isPromotional = (kind: string) => /campaign|promo|offer/i.test(kind);

/**
 * Where a notice leads, from the kinds the API writes: a reward held at the
 * counter, a gift, a data copy ready to download, or the shop's card (tiers,
 * missions, campaigns). Null leaves the row as plain text.
 */
function destination(
  notice: CustomerNotification,
  wallet: WalletCard[],
): Href | null {
  if (/redemption/i.test(notice.kind)) return "/approvals";
  if (/gift/i.test(notice.kind)) return "/gifts";
  if (/privacy/i.test(notice.kind)) return "/profile/export";
  const card = notice.businessId
    ? wallet.find((item) => item.businessId === notice.businessId)
    : undefined;
  return card
    ? {
        pathname: "/card/[id]",
        params: { id: card.id, programId: card.programId },
      }
    : null;
}

export default function Notifications() {
  const router = useRouter();
  const inbox = useNotifications();
  const rows = inbox.data ?? [];
  const { data: approvals = [] } = usePendingApprovals();
  const { data: wallet = [] } = useWallet();
  const readAll = useApiMutation(markNotificationsRead, {
    invalidates: [keys.customer.notifications()],
  });
  const unread = rows.some((n) => !n.read);
  const groups = [
    {
      title: "Service updates",
      detail: "Rewards, visits and your account. Always on.",
      rows: rows.filter((n) => !isPromotional(n.kind)),
    },
    {
      title: "Promotions",
      detail: "Offers from shops you joined, as your notification settings allow.",
      rows: rows.filter((n) => isPromotional(n.kind)),
    },
  ];

  return (
    <Screen title="Notifications" back bottom={48}>
      <Eyebrow>Your places</Eyebrow>
      <Title>Inbox</Title>
      <Lede>Service updates and promotions are kept apart.</Lede>

      {approvals.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/approvals")}
          className="mt-5 flex-row items-center gap-3 rounded-2xl bg-ink p-4"
        >
          <View className="size-10 items-center justify-center rounded-2xl bg-accent">
            <BadgeCheck size={18} color={colors.ink} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-extrabold text-[14px] text-paper">
              {approvals.length === 1
                ? "A reward is waiting for your approval"
                : `${approvals.length} rewards are waiting for your approval`}
            </Text>
            <Text className="mt-0.5 font-sans text-[11px] text-white/60">
              Your approval releases the reward at the counter.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.paper} />
        </Pressable>
      ) : null}

      <View className="mt-6">
        <QueryState
          isPending={inbox.isPending}
          error={inbox.error}
          onRetry={() => void inbox.refetch()}
          label="your inbox"
        >
          {groups.map((group) => (
            <View key={group.title} className="mt-6 first:mt-0">
              <Text className="font-sans-extrabold text-[16px] tracking-[-0.3px] text-ink">
                {group.title}
              </Text>
              <Text className="mt-0.5 font-sans text-[11px] text-muted">
                {group.detail}
              </Text>
              {group.rows.length === 0 ? (
                <Text className="mt-3 rounded-2xl border border-dashed border-line-strong p-4 font-sans text-[12px] text-muted">
                  Nothing here yet.
                </Text>
              ) : (
                <View className="mt-3 border-y border-line">
                  {group.rows.map((notification, index) => {
                    const to = destination(notification, wallet);
                    return (
                      <Pressable
                        key={notification.id}
                        accessibilityRole={to ? "button" : undefined}
                        disabled={!to}
                        onPress={() => to && router.push(to)}
                        className={`flex-row gap-3 py-5 ${index > 0 ? "border-t border-line" : ""}`}
                      >
                        <View
                          className={`mt-0.5 size-10 items-center justify-center rounded-2xl ${notification.read ? "bg-surface-2" : "bg-accent"}`}
                        >
                          <Bell size={17} color={colors.ink} />
                        </View>
                        <View className="min-w-0 flex-1">
                          <View className="flex-row items-center justify-between gap-3">
                            <Text className="flex-1 font-sans-extrabold text-[14px] text-ink">
                              {notification.title}
                            </Text>
                            {!notification.read ? (
                              <View
                                accessibilityLabel="Unread"
                                className="size-2 rounded-full bg-accent-strong"
                              />
                            ) : null}
                          </View>
                          <Text className="mt-1 font-sans-extrabold text-[10px] uppercase tracking-[1px] text-accent-strong">
                            {notification.business
                              ? `${notification.business} · `
                              : ""}
                            {notification.kind}
                          </Text>
                          <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
                            {notification.body}
                          </Text>
                          <Text className="mt-2 font-sans text-[10px] text-muted">
                            {relativeTime(notification.receivedAt)}
                          </Text>
                        </View>
                        {to ? (
                          <View className="justify-center">
                            <ChevronRight size={16} color={colors.muted} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </QueryState>
      </View>

      {rows.length > 0 && unread ? (
        <Button
          tone="quiet"
          className="mt-6"
          busy={readAll.isPending}
          onPress={() => readAll.mutate()}
        >
          Mark everything read
        </Button>
      ) : null}
    </Screen>
  );
}
