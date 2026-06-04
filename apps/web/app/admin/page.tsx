// apps/web/app/admin/page.tsx — /admin → dashboard. หอมฉลุย — Powered by 2T9COME.
import { redirect } from "next/navigation";

export default function AdminIndex() {
  redirect("/admin/dashboard");
}
