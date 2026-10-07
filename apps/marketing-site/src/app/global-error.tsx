"use client";

import { useEffect } from "react";
import { captureError } from "@kyprewards/ui/sentry";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    captureError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#faf8f3", color: "#18120c" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontSize: 42 }}>✦</div>
            <h1 style={{ margin: "20px 0 8px", fontSize: 30 }}>
              KYP Rewards needs a fresh start.
            </h1>
            <p style={{ margin: 0, color: "#5f534b", lineHeight: 1.6 }}>
              Nothing was changed. Reload the experience and continue where you
              left off.
            </p>
            <button
              type="button"
              onClick={retry}
              style={{
                marginTop: 24,
                minHeight: 48,
                border: 0,
                borderRadius: 999,
                background: "#18120c",
                color: "#fffefb",
                padding: "0 24px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reload KYP Rewards
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
