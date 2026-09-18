import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import {
  ApiError,
  claimFirstStamp,
  keys,
  offerFirstStamp,
  readFirstStamp,
  useQueryClient,
  useWallet,
  type FirstStampOffer,
} from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { StampDots } from "@/components/StampDots";
import { Button, Panel } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { rememberClaim } from "@/lib/claim";
import { colors } from "@/lib/theme";

/**
 * What a counter poster lands on - scanned in the app, or tapped as
 * `app.kyp.ph/join/<slug>` with the app installed.
 *
 * The stamp is shown before anything is asked; that is the whole point of
 * the flow. Signed in: the claim is settled here and the wallet updated.
 * Not signed in: the claim is minted, kept in the keychain, and settled on
 * the first launch that has a session - the same rule as the web wallet.
 */
export default function Join() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const status = useAuth((state) => state.status);
  const signedIn = status === "signed-in";
  const [offer, setOffer] = useState<FirstStampOffer | null>(null);
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { data: cards = [] } = useWallet({ enabled: signedIn });
  const alreadyMember =
    signedIn &&
    Boolean(offer?.businessId) &&
    cards.some((c) => c.businessId === offer?.businessId);
  const askedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || askedFor.current === slug) return;
    askedFor.current = slug;
    readFirstStamp(slug)
      .then(setOffer)
      .catch((failure) =>
        setFailed(
          failure instanceof ApiError && failure.status === 404
            ? "That counter code is not one we recognise. Ask staff to scan you in."
            : "We could not reach the counter just now. Ask staff to scan you in.",
        ),
      );
  }, [slug]);

  async function keep(
    destination:
      "/(auth)/create-account" | "/(auth)/login" = "/(auth)/create-account",
  ) {
    setBusy(true);
    setFailed("");
    try {
      const claimed = await offerFirstStamp(slug);
      if (signedIn) {
        await claimFirstStamp(claimed.claimToken);
        await queryClient.invalidateQueries({ queryKey: keys.customer.all });
        setDone(true);
      } else {
        await rememberClaim(claimed.claimToken, offer?.business ?? "");
        router.replace(destination);
      }
    } catch (failure) {
      setFailed(
        failure instanceof ApiError
          ? failure.message
          : "We could not hold that stamp just now. Ask staff to scan you in.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Your first stamp" back>
      {failed && !offer ? (
        <Panel>
          <Text className="font-display text-[22px] tracking-[-0.5px] text-ink">
            That join code did not work.
          </Text>
          <Text className="mt-2 font-sans text-[13px] leading-[19px] text-muted-strong">
            {failed}
          </Text>
          <Button
            tone="quiet"
            className="mt-5"
            onPress={() => router.replace("/(tabs)")}
          >
            Back to my wallet
          </Button>
        </Panel>
      ) : done ? (
        <Panel className="items-center">
          <View className="size-14 items-center justify-center rounded-full bg-accent">
            <Check size={26} color={colors.ink} strokeWidth={3} />
          </View>
          <Text className="mt-6 text-center font-display text-[26px] tracking-[-0.6px] text-ink">
            It&apos;s on your card.
          </Text>
          <Text className="mt-2 text-center font-sans text-[13px] leading-[19px] text-muted-strong">
            Your welcome stamp is pending until staff confirm your first visit,
            and then the card reads two.
          </Text>
          <Button
            className="mt-6"
            onPress={() => router.replace("/(tabs)/wallet")}
          >
            Open my wallet
          </Button>
        </Panel>
      ) : !offer ? (
        <Panel className="items-center py-12">
          <Text className="font-sans-bold text-[13px] text-muted-strong">
            Getting your stamp…
          </Text>
        </Panel>
      ) : (
        <>
          <Panel className="items-center">
            <View className="size-14 items-center justify-center rounded-full bg-accent">
              <Check size={26} color={colors.ink} strokeWidth={3} />
            </View>
            <Text className="mt-6 text-center font-display text-[28px] leading-[32px] tracking-[-0.8px] text-ink">
              {alreadyMember
                ? "You already have this card."
                : signedIn
                  ? "A stamp for you."
                  : "That’s your first stamp."}
            </Text>
            <Text className="mt-2 text-center font-sans text-[13px] text-muted-strong">
              At {offer.business} · {offer.branch}
            </Text>
            <View className="mt-7 w-full rounded-2xl bg-paper p-5">
              <StampDots
                filled={offer.stamps}
                total={offer.target}
                icon={offer.stampIcon}
                imageUrl={offer.stampImageUrl}
              />
              <Text className="mt-4 font-sans-extrabold text-[14px] text-ink">
                {offer.stamps} of {offer.target} toward {offer.reward}
              </Text>
            </View>
          </Panel>
          <Panel className="mt-4">
            <Text className="font-sans-extrabold text-[14px] text-ink">
              {alreadyMember
                ? "Ask staff to scan you in."
                : signedIn
                  ? "Keep it."
                  : "Keep it with your number."}
            </Text>
            <Text className="mt-1 font-sans text-[12px] leading-[18px] text-muted-strong">
              {alreadyMember
                ? "The poster is for first-time visitors. Show your code at the counter and staff will add today's stamp."
                : signedIn
                  ? "A new card, in the wallet you already have."
                  : "One number and a password. It saves this stamp and every one after it."}
            </Text>
            <Button
              className="mt-5"
              busy={busy}
              disabled={alreadyMember}
              onPress={() => keep()}
            >
              {alreadyMember
                ? "Already on your card"
                : signedIn
                  ? "Add it to my wallet"
                  : "Save my stamp"}
            </Button>
            {!signedIn ? (
              <Button
                tone="quiet"
                className="mt-2"
                // Both paths mint, so the returning customer keeps the stamp too.
                onPress={() => keep("/(auth)/login")}
              >
                I already have a wallet
              </Button>
            ) : null}
            {failed ? (
              <Text
                accessibilityRole="alert"
                className="mt-3 font-sans-bold text-[12px] text-danger"
              >
                {failed}
              </Text>
            ) : null}
          </Panel>
        </>
      )}
    </Screen>
  );
}
