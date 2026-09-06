import { Text, View } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { colors } from "@/lib/theme";

/* Seal badge - 16 rounded scallops around a solid disc, gold ring, K monogram.
   The same geometry as packages/ui's SealMark (docs/BRAND.md): 512 grid,
   scallops at r=186, disc r=190, ring r=126. */
const BUMPS = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8;
  return [256 + 186 * Math.cos(a), 256 + 186 * Math.sin(a)] as const;
});

export function SealMark({
  size = 40,
  inverse = false,
}: {
  size?: number;
  inverse?: boolean;
}) {
  const badge = inverse ? colors.accent : colors.ink;
  const mono = inverse ? colors.ink : colors.paper;
  const ring = inverse ? colors.ink : colors.accent;
  return (
    <Svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      accessibilityElementsHidden
    >
      <G fill={badge}>
        {BUMPS.map(([x, y]) => (
          <Circle key={`${x},${y}`} cx={x} cy={y} r={40} />
        ))}
        <Circle cx={256} cy={256} r={190} />
      </G>
      <Circle
        cx={256}
        cy={256}
        r={126}
        fill="none"
        stroke={ring}
        strokeWidth={15}
        opacity={inverse ? 0.35 : 1}
      />
      <SvgText
        x={256}
        y={313}
        textAnchor="middle"
        fontFamily="Sora_700Bold"
        fontSize={160}
        fontWeight="700"
        fill={mono}
      >
        K
      </SvgText>
    </Svg>
  );
}

/** "KYP" alone: the shopper side of the brand, as on kyp.ph and the wallet. */
export function BrandMark({
  tagline = "One card for every shop",
  inverse = false,
}: {
  tagline?: string | null;
  inverse?: boolean;
}) {
  return (
    <View
      className="flex-row items-center gap-3"
      accessibilityRole="image"
      accessibilityLabel="KYP"
    >
      <SealMark size={38} inverse={inverse} />
      <View>
        <Text
          className={`font-display text-[17px] tracking-[-0.3px] ${inverse ? "text-accent" : "text-accent-strong"}`}
        >
          KYP
        </Text>
        {tagline ? (
          <Text
            className={`mt-0.5 font-sans-semibold text-[9px] uppercase tracking-[1.3px] ${inverse ? "text-white/60" : "text-muted"}`}
          >
            {tagline}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
