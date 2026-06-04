"use client";
// apps/web/app/admin/login/page.tsx — backoffice sign-in. หอมฉลุย — Powered by 2T9COME.
// Credentials sign-in via NextAuth. Standalone (outside the guarded panel layout) to avoid a
// redirect loop. Footer credit present per the permanent rule.
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/Footer";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(params.get("from") ?? "/admin/dashboard");
    router.refresh();
  }

  const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-card p-6">
      <div>
        <h1 className="text-lg font-semibold text-brand-dark">เข้าสู่ระบบหลังบ้าน</h1>
        <p className="text-xs text-text-muted">หอมฉลุย — Powered by 2T9COME</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-text-secondary">อีเมล</span>
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-text-secondary">รหัสผ่าน</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
      <Footer locale="th" />
    </div>
  );
}
