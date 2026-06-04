"use client";
// apps/web/components/admin/SignOutButton.tsx — หอมฉลุย — Powered by 2T9COME.
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="rounded-full border border-line px-3 py-1 text-xs text-text-secondary hover:border-brand"
    >
      ออกจากระบบ
    </button>
  );
}
