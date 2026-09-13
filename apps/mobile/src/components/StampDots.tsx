import { Image, ScrollView, Text, View } from "react-native";
import {
  Check,
  Coffee,
  Dumbbell,
  Heart,
  Scissors,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react-native";
import { colors, withAlpha } from "@/lib/theme";

/** The same presets as `STAMP_ICONS` in packages/ui, by the API's names. */
const icons: Record<string, typeof Check> = {
  check: Check,
  star: Star,
  heart: Heart,
  coffee: Coffee,
  utensils: Utensils,
  scissors: Scissors,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
};

/**
 * The stamp row. Filled dots are amber with the shop's mark - their own
 * picture clipped to the circle, else their preset, else a tick; empty ones
 * are dashed outlines in the card's own ink, so the row reads on any card
 * colour. Scrolls sideways past ten: a thirty-stamp card is a real thing a
 * merchant can configure and the row must not push the screen wider.
 */
export function StampDots({
  filled = 0,
  total = 8,
  ink = colors.ink,
  icon,
  imageUrl,
  mark,
}: {
  filled?: number;
  total?: number;
  /** The ink of the surface this sits on, for the empty dots. */
  ink?: string;
  icon?: string | null;
  imageUrl?: string | null;
  /** Text inside a collected stamp instead of the mark. */
  mark?: string;
}) {
  const Icon = icons[icon ?? "check"] ?? Check;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="image"
      accessibilityLabel={`${filled} of ${total} stamps collected`}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = index < filled;
        return (
          <View
            key={index}
            className="size-7 items-center justify-center overflow-hidden rounded-full"
            style={
              done
                ? { backgroundColor: colors.accent }
                : {
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: withAlpha(ink, 0.4),
                  }
            }
          >
            {!done ? null : mark ? (
              <Text
                className="font-display text-[10px]"
                style={{ color: colors.ink }}
              >
                {mark}
              </Text>
            ) : imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 28, height: 28 }}
                resizeMode="cover"
                accessibilityElementsHidden
              />
            ) : (
              <Icon size={13} strokeWidth={2.6} color={colors.ink} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
