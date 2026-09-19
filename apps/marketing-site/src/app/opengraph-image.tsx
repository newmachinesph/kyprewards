import { ImageResponse } from "next/og";

export const alt = "KYP Stamping loyalty program receipt and return-visit ledger";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Scalloped seal badge — same geometry as the app icons (docs/BRAND.md). */
const SEAL_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${Array.from(
    { length: 16 },
    (_, i) =>
      `<circle cx="${(256 + 186 * Math.cos((i * Math.PI) / 8)).toFixed(1)}" cy="${(
        256 +
        186 * Math.sin((i * Math.PI) / 8)
      ).toFixed(1)}" r="40" fill="#18120c"/>`,
  ).join(
    "",
  )}<circle cx="256" cy="256" r="190" fill="#18120c"/><circle cx="256" cy="256" r="126" fill="none" stroke="#e8a33d" stroke-width="15"/><text x="256" y="313" text-anchor="middle" font-family="Arial, sans-serif" font-size="160" font-weight="700" fill="#faf8f3">K</text></svg>`,
)}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#faf8f3",
        color: "#18120c",
        padding: "72px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "radial-gradient(900px 420px at 100% 0%, rgba(232, 163, 61, 0.18), transparent 70%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 650,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {/* Seal badge, inlined as a data URI so satori renders it as an image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SEAL_DATA_URI} width={56} height={56} alt="" />
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#8f5510" }}>KYP</span>
            <span>Stamping</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 64,
            fontSize: 70,
            lineHeight: 1.02,
            letterSpacing: -2,
            fontWeight: 700,
          }}
        >
          Loyalty, made local.
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 24,
            lineHeight: 1.4,
            color: "#5f534b",
          }}
        >
          One stamp card · a fast counter · campaigns that show their cost ·
          customer control
        </div>
      </div>
      <div
        style={{
          width: 320,
          minHeight: 460,
          padding: "38px",
          background: "#fffefb",
          boxShadow: "0 30px 80px rgba(33,27,23,.16)",
          transform: "rotate(3deg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 17, letterSpacing: 3, fontWeight: 800 }}>
          RETURN VISIT 005
        </div>
        <div
          style={{
            marginTop: 42,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
          }}
        >
          <span>Today</span>
          <b>+1 stamp</b>
        </div>
        <div style={{ marginTop: 22, height: 1, background: "#bcae9f" }} />
        <div
          style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: index < 5 ? "#e8a33d" : "transparent",
                border: index < 5 ? "none" : "2px dashed #d6ccbf",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: -0.5,
              }}
            >
              {index < 5 ? "SC" : ""}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 38, fontSize: 18, fontWeight: 800 }}>
          3 visits to a free pastry
        </div>
      </div>
    </div>,
    size,
  );
}
