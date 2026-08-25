"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f7f3ec", color: "#211b17" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
          <div style={{ maxWidth: 400 }}>
            <div style={{ fontSize: 42 }}>♥</div>
            <h1 style={{ margin: "20px 0 8px", fontSize: 30 }}>Your wallet needs a reload.</h1>
            <p style={{ margin: 0, color: "#5f534b", lineHeight: 1.6 }}>Your rewards are safe. Retry Stampr to bring your cards back.</p>
            <button type="button" onClick={retry} style={{ marginTop: 24, minHeight: 48, border: 0, borderRadius: 999, background: "#211b17", color: "#fffdf8", padding: "0 24px", fontWeight: 800, cursor: "pointer" }}>Reload wallet</button>
          </div>
        </main>
      </body>
    </html>
  );
}
