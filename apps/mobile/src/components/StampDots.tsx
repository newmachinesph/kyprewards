import { ScrollView, Text, View } from "react-native";
import { colors, withAlpha } from "@/lib/theme";

/**
 * The stamp row. Filled dots are amber with the shop's mark; empty ones are
 * dashed outlines in the card's own ink, so the row reads on any card colour.
 * Scrolls sideways past ten: a thirty-stamp card is a real thing a merchant
 * can configure and the row must not push the screen wider.
 */
export function StampDots({
  filled = 0,
  total = 8,
  ink = colors.ink,
  mark,
}: {
  filled?: number;
  total?: number;
  /** The ink of the surface this sits on, for the empty dots. */
  ink?: string;
  mark?: string;
}) {
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
            className="size-7 items-center justify-center rounded-full"
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
            {done && mark ? (
              <Text
                className="font-display text-[10px]"
                style={{ color: colors.ink }}
              >
                {mark}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
