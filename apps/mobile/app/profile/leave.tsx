import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import {
  keys,
  leaveBusiness,
  requestData,
  useApiMutation,
  useDataRequests,
  useWallet,
} from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Title } from "@/components/ui";
import { notify } from "@/components/Toast";
import { colors } from "@/lib/theme";

/**
 * The smallest action that fits: leave one shop without touching the rest,
 * or ask for the whole account to go after identity verification.
 */
export default function Leave() {
  const { data: wallet = [] } = useWallet();
  const shops = wallet.filter(
    (card, index, all) =>
      all.findIndex((other) => other.id === card.id) === index,
  );
  const [open, setOpen] = useState(false);
  const leave = useApiMutation(leaveBusiness, {
    invalidates: [keys.customer.wallet(), keys.customer.discover()],
    onError: (failure) => notify(failure.message, "error"),
  });
  const { data: requests = [] } = useDataRequests();
  const deletionRequested = requests.some(
    (r) => r.kind === "deletion" && r.status !== "completed",
  );
  const deletion = useApiMutation(requestData, {
    invalidates: [keys.customer.dataRequests()],
    onSuccess: () =>
      notify("Account deletion request queued for identity review."),
    onError: (failure) => notify(failure.message, "error"),
  });

  return (
    <Screen title="Leave or delete" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Leave or delete</Title>
      <View className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <Trash2 size={22} color={colors.danger} />
        <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
          Choose the smallest action that fits.
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          You can leave one business without deleting the rest of your wallet,
          or request full account deletion after identity verification.
        </Text>
      </View>
      <Button
        tone="quiet"
        className="mt-4"
        onPress={() => setOpen((on) => !on)}
      >
        Choose a business to leave
      </Button>
      {open ? (
        <View className="mt-3 rounded-2xl border border-line bg-surface">
          {shops.map((card, index) => (
            <Pressable
              key={card.id}
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  `Leave ${card.business}?`,
                  "The card leaves your wallet. Stamps on it are not kept.",
                  [
                    { text: "Stay", style: "cancel" },
                    {
                      text: "Leave",
                      style: "destructive",
                      onPress: () =>
                        leave.mutate(card.id, {
                          onSuccess: () =>
                            notify(
                              `You left ${card.business}. The card is out of your wallet.`,
                            ),
                        }),
                    },
                  ],
                )
              }
              className={`min-h-[48px] flex-row items-center justify-between px-4 ${index > 0 ? "border-t border-line" : ""}`}
            >
              <Text className="font-sans-bold text-[12px] text-ink">
                {card.business}
              </Text>
              <Text className="font-sans-bold text-[12px] text-danger">
                Leave
              </Text>
            </Pressable>
          ))}
          {shops.length === 0 ? (
            <Text className="px-4 py-4 font-sans text-[12px] text-muted">
              You have left every program.
            </Text>
          ) : null}
        </View>
      ) : null}
      <Button
        tone="danger"
        className="mt-6"
        busy={deletion.isPending}
        disabled={deletionRequested}
        onPress={() =>
          Alert.alert(
            "Request deletion of your KYP account?",
            "Your stamps, points, and stored value at every business would be permanently removed once identity is verified.",
            [
              { text: "Keep my account", style: "cancel" },
              {
                text: "Request deletion",
                style: "destructive",
                onPress: () => deletion.mutate("deletion"),
              },
            ],
          )
        }
      >
        {deletionRequested
          ? "Deletion request received"
          : "Request account deletion"}
      </Button>
    </Screen>
  );
}
