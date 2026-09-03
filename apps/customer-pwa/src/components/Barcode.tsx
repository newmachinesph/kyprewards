/**
 * The member code as an EAN-13 symbol, drawn as SVG so it needs no chunk and
 * renders with no signal.
 *
 * Structure: start guard, six digits in L or G parity chosen by the first
 * digit, centre guard, six digits in R, end guard. 95 modules in all.
 */

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = L.map((bits) => bits.replace(/[01]/g, (bit) => (bit === "0" ? "1" : "0")));
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

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

export function Barcode({ code, height = 56 }: { code: string; height?: number }) {
  const modules = ean13Modules(code);
  if (!modules) return null;
  const quiet = 9;
  const width = modules.length + quiet * 2;
  const bars: string[] = [];
  for (let x = 0; x < modules.length; x++) {
    if (modules[x] === "1") bars.push(`M${x + quiet} 0h1v${height}h-1z`);
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Barcode for member code ${code}`}
    >
      <rect width={width} height={height} fill="#ffffff" />
      <path d={bars.join("")} fill="#181210" />
    </svg>
  );
}
