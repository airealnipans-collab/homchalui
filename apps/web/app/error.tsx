"use client";
// apps/web/app/error.tsx — runtime error boundary. หอมฉลุย — Powered by 2T9COME.
// Rendered inside the root layout (which has <html>/<body>/GTM) but outside the route-group
// layout, so it renders the Footer itself to keep the permanent "Powered by 2T9COME" credit.
// Locale isn't reliably available in a client error boundary, so copy is shown in all three.
import { useEffect } from "react";
import { Footer } from "@/components/Footer";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the console; Sentry wiring lands with observability.
    console.error(error);
  }, [error]);

  return (
    <>
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-brand-dark">เกิดข้อผิดพลาด · Something went wrong · 出错了</h1>
        <p className="mt-3 max-w-md text-sm text-text-secondary">
          ลองใหม่อีกครั้ง · Please try again · 请重试
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          ลองอีกครั้ง · Retry · 重试
        </button>
      </main>
      <Footer locale="th" />
    </>
  );
}
