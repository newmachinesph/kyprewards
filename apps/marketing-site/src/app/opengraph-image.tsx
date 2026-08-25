import { ImageResponse } from "next/og";

export const alt = "Stampr loyalty program receipt and return-visit ledger";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#f6f2ea",
        color: "#211b17",
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
          opacity: 0.08,
          backgroundImage:
            "linear-gradient(#211b17 1px, transparent 1px), linear-gradient(90deg, #211b17 1px, transparent 1px)",
          backgroundSize: "28px 28px",
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
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 15,
              background: "#211b17",
              color: "#f6f2ea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            S
          </div>
          Stampr
        </div>
        <div
          style={{
            marginTop: 64,
            fontSize: 70,
            lineHeight: 0.98,
            letterSpacing: -4,
            fontWeight: 900,
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
          Customer PWA · staff operations · profitable campaigns · clear
          customer control
        </div>
      </div>
      <div
        style={{
          width: 320,
          minHeight: 460,
          padding: "38px",
          background: "#fffdf8",
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
                background: index < 5 ? "#e39a45" : "transparent",
                border: "2px solid #e39a45",
                fontWeight: 900,
              }}
            >
              {index < 5 ? "S" : ""}
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
