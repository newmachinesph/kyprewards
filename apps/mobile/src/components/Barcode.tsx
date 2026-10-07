import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "@/lib/theme";

/**
 * The member code as an EAN-13 symbol, for counters with a 1D scanner. Drawn
 * from the code alone, so it shows offline from the cached code.
 *
 * Ported from the web wallet's `Barcode.tsx`: start guard, six digits in L or
 * G parity chosen by the first digit, centre guard, six digits in R, end
 * guard. 95 modules in all.
 */

const L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];
const G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];
const R = L.map((bits) =>
  bits.replace(/[01]/g, (bit) => (bit === "0" ? "1" : "0")),
);
const PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

/** The 95 modules for a thirteen-digit code, or null when it is not one. */
export function ean13Modules(code: string): string | null {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 13) return null;
  const parity = PARITY[Number(digits[0])];
  let bits = "101";
  for (let i = 1; i <= 6; i++) {
    bits += (parity[i - 1] === "L" ? L : G)[Number(digits[i])];
  }
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[Number(digits[i])];
  return `${bits}101`;
}

export function Barcode({
  code,
  width,
  height = 52,
}: {
  code: string;
  width: number;
  height?: number;
}) {
  const modules = ean13Modules(code);
  if (!modules) return null;
  const quiet = 9;
  const span = modules.length + quiet * 2;
  let bars = "";
  for (let x = 0; x < modules.length; x++) {
    if (modules[x] === "1") bars += `M${x + quiet} 0h1v${height}h-1z`;
  }
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${span} ${height}`}
      preserveAspectRatio="none"
    >
      <Rect width={span} height={height} fill="#ffffff" />
      <Path d={bars} fill={colors.ink} />
    </Svg>
  );
}
