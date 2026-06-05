// apps/web/app/admin/(panel)/layout.tsx — backoffice shell (guarded). หอมฉลุย — Powered by 2T9COME.
// Defense-in-depth: middleware already redirects unauthenticated users to /admin/login; this also
// resolves the current user for the permission-aware nav + top bar. Footer credit on admin pages.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { Footer } from "@/components/Footer";
import { SignOutButton } from "@/components/admin/SignOutButton";

const NAV: { href: string; label: string; perm?: Parameters<typeof hasPermission>[1] }[] = [
  { href: "/admin/dashboard", label: "แดชบอร์ด" },
  { href: "/admin/products", label: "สินค้า", perm: "product.update" },
  { href: "/admin/reviews", label: "รีวิว", perm: "review.publish" },
  { href: "/admin/layout", label: "เลย์เอาต์", perm: "layout.update" },
  { href: "/admin/seo", label: "SEO", perm: "seo.update" },
  { href: "/admin/translations", label: "คำแปล", perm: "translation.update" },
  { href: "/admin/ranking", label: "อันดับ", perm: "algorithm.update" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-line bg-card md:block">
          <div className="px-4 py-4 text-lg font-semibold text-brand-dark">หอมฉลุย · หลังบ้าน</div>
          <nav className="flex flex-col gap-1 px-2">
            {NAV.filter((n) => !n.perm || hasPermission(user, n.perm)).map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-soft hover:text-brand">
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line bg-card px-6 py-3">
            <span className="text-sm font-medium text-brand-dark md:hidden">หอมฉลุย · หลังบ้าน</span>
            <span className="ml-auto flex items-center gap-3 text-xs text-text-secondary">
              <span>{user.email} · {user.roles.join(", ") || "no role"}</span>
              <SignOutButton />
            </span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <Footer locale="th" />
    </div>
  );
}
