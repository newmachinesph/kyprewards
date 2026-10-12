import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react-native";
import {
  idempotencyKey,
  keys,
  sendGift,
  useApiMutation,
  useCustomerGifts,
  useWallet,
  type GiftTransfer,
} from "@kyprewards/api";
import { looksLikeMemberCode, relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import {
  Button,
  Chip,
  EmptyState,
  Eyebrow,
  Lede,
  Panel,
  QueryState,
  Title,
} from "@/components/ui";
import { notify } from "@/components/Toast";
import { colors } from "@/lib/theme";

/**
 * Pasalubong: a held reward or points sent to another member of the same
 * shop. The list is what the API says was sent and received.
 */
export default function Gifts() {
  const gifts = useCustomerGifts();
  const rows = gifts.data ?? [];
  const [sending, setSending] = useState(false);
  const received = rows.filter((gift) => gift.direction === "received");
  const sent = rows.filter((gift) => gift.direction === "sent");

  return (
    <Screen title="Gifts" back bottom={48}>
      <Eyebrow>Pasalubong</Eyebrow>
      <Title>Gifts</Title>
      <Lede>
        Send a held reward or points to another member of the same shop.
      </Lede>
      <Button
        className="mt-5"
        icon={<Gift size={16} color={colors.paper} />}
        onPress={() => setSending((open) => !open)}
      >
        {sending ? "Close the gift form" : "Send a gift"}
      </Button>
      {sending ? <SendGiftForm onSent={() => setSending(false)} /> : null}
      <View className="mt-7">
        <QueryState
          isPending={gifts.isPending}
          error={gifts.error}
          onRetry={() => void gifts.refetch()}
          label="gifts"
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={<Gift size={22} color={colors.muted} />}
              title="No gifts yet."
              detail="Gifts you send and receive are listed here with the shop they belong to."
            />
          ) : (
            <>
              <GiftList title="Received" rows={received} />
              <GiftList title="Sent" rows={sent} />
            </>
          )}
        </QueryState>
      </View>
    </Screen>
  );
}

function GiftList({ title, rows }: { title: string; rows: GiftTransfer[] }) {
  return (
    <View className="mt-5">
      <Text className="font-sans-extrabold text-[16px] tracking-[-0.3px] text-ink">
        {title}
      </Text>
      {rows.length === 0 ? (
        <Text className="mt-2 font-sans text-[12px] text-muted">
          Nothing {title.toLowerCase()} yet.
        </Text>
      ) : (
        <View className="mt-3 rounded-2xl border border-line bg-surface">
          {rows.map((gift, index) => {
            const Icon =
              gift.direction === "received" ? ArrowDownLeft : ArrowUpRight;
            return (
              <View
                key={gift.id}
                className={`flex-row items-start gap-3 p-4 ${index > 0 ? "border-t border-line" : ""}`}
              >
                <View className="size-10 items-center justify-center rounded-2xl bg-surface-2">
                  <Icon size={17} color={colors.ink} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-extrabold text-[14px] text-ink">
                    {gift.kind === "reward"
                      ? gift.reward
                      : `${gift.units} ${gift.units === 1 ? "point" : "points"}`}
                  </Text>
                  <Text className="mt-0.5 font-sans text-[11px] text-muted-strong">
                    {gift.direction === "received"
                      ? `From ${gift.fromName}`
                      : `To ${gift.toName}`}{" "}
                    · {gift.business}
                  </Text>
                  {gift.message ? (
                    <Text className="mt-1 font-sans text-[12px] italic text-muted-strong">
                      “{gift.message}”
                    </Text>
                  ) : null}
                  <Text className="mt-1 font-sans text-[10px] text-muted">
                    {relativeTime(gift.sentAt)} ·{" "}
                    {gift.status === "accepted" ? "accepted" : "sent"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SendGiftForm({ onSent }: { onSent: () => void }) {
  const { data: wallet = [] } = useWallet();
  const cards = wallet.filter(
    (card) => card.rewardsAvailable > 0 || card.kind === "Points",
  );
  const [cardKey, setCardKey] = useState(
    cards[0] ? `${cards[0].id}:${cards[0].programId}` : "",
  );
  const card = cards.find((item) => `${item.id}:${item.programId}` === cardKey);
  const [toMemberCode, setToMemberCode] = useState("");
  const [units, setUnits] = useState("");
  const [message, setMessage] = useState("");
  const [choice, setChoice] = useState<"reward" | "points">("reward");
  const canReward = Boolean(card && card.rewardsAvailable > 0);
  const canPoints = Boolean(card && card.kind === "Points");
  // What was chosen, if this card allows it; a card with only one of the two
  // sends that one.
  const kind: "reward" | "points" =
    choice === "reward" && canReward ? "reward" : canPoints ? "points" : "reward";
  const unitsNumber = Number(units);
  const ready =
    Boolean(card) &&
    looksLikeMemberCode(toMemberCode) &&
    (kind === "reward"
      ? canReward
      : canPoints && Number.isInteger(unitsNumber) && unitsNumber > 0) &&
    message.trim().length > 0;
  const send = useApiMutation(
    (body: Parameters<typeof sendGift>[0]) =>
      sendGift(
        body,
        idempotencyKey(
          "gift",
          `${body.membershipId}_${body.toMemberCode}_${Date.now()}`,
        ),
      ),
    {
      invalidates: [keys.wallet.gifts(), keys.customer.wallet()],
      onSuccess: () => {
        notify("Gift sent.");
        onSent();
      },
      onError: (failure) => notify(failure.message, "error"),
    },
  );

  if (cards.length === 0) {
    return (
      <Panel className="mt-4">
        <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
          Nothing to give yet. A gift is a reward you are holding, or points on
          a points card.
        </Text>
      </Panel>
    );
  }

  return (
    <Panel className="mt-4">
      <Text className="font-sans-extrabold text-[12px] text-ink">
        From which card
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {cards.map((item) => (
          <Chip
            key={`${item.id}:${item.programId}`}
            label={`${item.business} · ${item.kind}`}
            selected={cardKey === `${item.id}:${item.programId}`}
            onPress={() => setCardKey(`${item.id}:${item.programId}`)}
          />
        ))}
      </View>
      {canReward && canPoints ? (
        <>
          <Text className="mt-4 font-sans-extrabold text-[12px] text-ink">
            What to send
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Chip
              label="A held reward"
              selected={kind === "reward"}
              onPress={() => setChoice("reward")}
            />
            <Chip
              label="Points"
              selected={kind === "points"}
              onPress={() => setChoice("points")}
            />
          </View>
        </>
      ) : null}
      <Text className="mt-4 font-sans-extrabold text-[12px] text-ink">
        Their member code
      </Text>
      <TextInput
        value={toMemberCode}
        onChangeText={setToMemberCode}
        keyboardType="number-pad"
        placeholder="1234 5678 9012 3"
        placeholderTextColor={colors.muted}
        className="mt-2 min-h-[44px] rounded-xl border border-line bg-paper px-3 font-mono text-[14px] text-ink"
      />
      {kind === "points" ? (
        <>
          <Text className="mt-4 font-sans-extrabold text-[12px] text-ink">
            Points
          </Text>
          <TextInput
            value={units}
            onChangeText={(typed) => setUnits(typed.replace(/\D/g, ""))}
            keyboardType="number-pad"
            placeholder="50"
            placeholderTextColor={colors.muted}
            className="mt-2 min-h-[44px] rounded-xl border border-line bg-paper px-3 font-sans-semibold text-[14px] text-ink"
          />
        </>
      ) : (
        <Text className="mt-3 font-sans text-[11px] text-muted-strong">
          Sends one held {card?.reward ?? "reward"} from this card.
        </Text>
      )}
      <Text className="mt-4 font-sans-extrabold text-[12px] text-ink">
        A note
      </Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        maxLength={200}
        placeholder="Pasalubong from Kapitolyo!"
        placeholderTextColor={colors.muted}
        multiline
        className="mt-2 min-h-[64px] rounded-xl border border-line bg-paper px-3 py-2 font-sans text-[14px] text-ink"
      />
      <Button
        className="mt-4"
        busy={send.isPending}
        disabled={!ready}
        onPress={() =>
          card &&
          send.mutate({
            membershipId: card.id,
            toMemberCode: toMemberCode.replace(/\D/g, ""),
            ...(kind === "reward" ? {} : { units: unitsNumber }),
            message: message.trim(),
          })
        }
      >
        Send the gift
      </Button>
    </Panel>
  );
}
