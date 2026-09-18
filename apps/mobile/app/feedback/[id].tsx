import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Check, Star } from "lucide-react-native";
import { ApiError, answerFeedback } from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Lede, Panel, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

/**
 * The post-visit question, for `app.kyp.ph/feedback/<id>` opened with the app
 * installed. Same rules as the web wallet's form: no sign-in, a rating and an
 * optional sentence, the id in the link is the only key.
 */
export default function Feedback() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState("");

  async function submit() {
    if (!id) return;
    setSending(true);
    setFailed("");
    try {
      await answerFeedback(id, { rating, comment: comment.trim() });
      setDone(true);
    } catch (failure) {
      // 409 is "already answered", which is a fine thing to have done.
      setFailed(
        failure instanceof ApiError
          ? failure.message
          : "That did not send. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen title="Feedback" back bottom={48}>
      {done ? (
        <Panel>
          <View className="items-center py-4">
            <View className="size-14 items-center justify-center rounded-full bg-accent">
              <Check size={26} color={colors.ink} strokeWidth={3} />
            </View>
            <Title>Thank you.</Title>
            <Lede>That goes straight to the shop. Nothing else is needed from you.</Lede>
          </View>
        </Panel>
      ) : (
        <>
          <Eyebrow>One question</Eyebrow>
          <Title>How was your visit?</Title>
          <Lede>No account needed.</Lede>
          <View className="mt-7 flex-row justify-between gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${value} out of 5`}
                accessibilityState={{ selected: rating === value }}
                onPress={() => setRating(value)}
                className={`size-14 items-center justify-center rounded-2xl border ${value <= rating ? "border-accent-strong bg-accent" : "border-line-strong bg-surface"}`}
              >
                <Star
                  size={22}
                  color={colors.ink}
                  fill={value <= rating ? colors.ink : "transparent"}
                />
              </Pressable>
            ))}
          </View>
          <Text className="mt-6 font-sans-extrabold text-[12px] text-ink">
            Anything you want to add, optional
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={4000}
            className="mt-2 min-h-[96px] rounded-2xl border border-line-strong bg-surface p-3 font-sans text-[14px] text-ink"
            style={{ textAlignVertical: "top" }}
          />
          {failed ? (
            <Text className="mt-3 font-sans-bold text-[12px] text-danger">{failed}</Text>
          ) : null}
          <View className="mt-6">
            <Button busy={sending} disabled={rating === 0} onPress={() => void submit()}>
              {rating === 0 ? "Pick a rating" : "Send"}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}
