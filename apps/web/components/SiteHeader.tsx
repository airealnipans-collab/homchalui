// apps/web/components/SiteHeader.tsx — responsive site header. หอมฉลุย — Powered by 2T9COME.
// Mobile (default): hamburger + icon+wordmark + search/heart/bag icons.
// Desktop (md+):     horizontal logo + search bar + nav links + language + heart/bell.
// Light header per the brand header mockup. Interactive bits (search, language, menu) become
// client components in a later pass; static markup here keeps it server-rendered.
import Link from "next/link";
import { Logo, LogoCompact } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      {/* Mobile */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:hidden">
        <button type="button" aria-label="เมนู" className="text-brand-dark">
          <span className="ti ti-menu-2 text-[22px]" aria-hidden="true" />
        </button>
        <LogoCompact />
        <div className="ml-auto flex items-center gap-3 text-brand-dark">
          <Link href="/search" aria-label="ค้นหา"><span className="ti ti-search text-[21px]" aria-hidden="true" /></Link>
          <Link href="/wishlist" aria-label="รายการที่ถูกใจ"><span className="ti ti-heart text-[21px]" aria-hidden="true" /></Link>
          <Link href="/account" aria-label="บัญชี"><span className="ti ti-user text-[21px]" aria-hidden="true" /></Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-6xl items-center gap-6 px-6 py-3 md:flex">
        <Logo variant="horizontal" height={44} />
        <form action="/search" className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-line bg-bg px-4 py-2">
          <span className="ti ti-search text-[16px] text-brand" aria-hidden="true" />
          <input
            name="q"
            placeholder="ค้นหาน้ำหอม กลิ่น แบรนด์..."
            className="w-full bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted"
            aria-label="ค้นหา"
          />
        </form>
        <nav className="flex items-center gap-5 text-sm text-text-secondary">
          <Link href="/category/perfume">หมวดหมู่</Link>
          <Link href="/reviews">รีวิว</Link>
          <Link href="/guide">บทความ</Link>
          <span className="flex items-center gap-1 border-l border-line pl-5">
            <span className="ti ti-world text-[16px]" aria-hidden="true" /> ไทย
          </span>
          <Link href="/wishlist" aria-label="รายการที่ถูกใจ"><span className="ti ti-heart text-[19px] text-brand-dark" aria-hidden="true" /></Link>
          <Link href="/account" aria-label="บัญชี"><span className="ti ti-user text-[19px] text-brand-dark" aria-hidden="true" /></Link>
        </nav>
      </div>
    </header>
  );
}
