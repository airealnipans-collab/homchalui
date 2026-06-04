"use client";
// apps/web/app/global-error.tsx — last-resort boundary for errors in the root layout itself.
// It REPLACES the root layout, so it must render its own <html>/<body>. We still print the
// permanent "Powered by 2T9COME" credit. หอมฉลุย — Powered by 2T9COME.
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="th">
      <body>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>
            เกิดข้อผิดพลาด · Something went wrong · 出错了
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
            ลองใหม่อีกครั้ง · Please try again · 请重试
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 32, padding: "10px 24px", borderRadius: 9999, cursor: "pointer" }}
          >
            ลองอีกครั้ง · Retry · 重试
          </button>
          <p style={{ marginTop: 48, fontWeight: 500, letterSpacing: "0.05em" }}>Powered by 2T9COME</p>
        </main>
      </body>
    </html>
  );
}
