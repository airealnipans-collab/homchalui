// apps/web/components/SiteHeader.tsx — responsive, locale-aware site header. หอมฉลุย — Powered by 2T9COME.
// Mobile: hamburger + compact logo + search/heart/user. Desktop (md+): logo + search + language
// switcher + heart/user. All links are localized via localizedPath(locale, …). The
// LanguageSwitcher maps to the equivalent entity in each locale (no Thai fallback).
import Link from "next/link";
import { localizedPath, DEFAULT_LOCALE, type Locale } from "@homchalui/i18n";
import { Logo, LogoCompact } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const SEARCH_PLACEHOLDER: Record<Locale, string> = {
  th: "ค้นหาน้ำหอม กลิ่น แบรนด์...",
  en: "Search perfumes, scents, brands...",
  zh: "搜索香水、香调、品牌…",
};
const SEARCH_LABEL: Record<Locale, string> = { th: "ค้นหา", en: "Search", zh: "搜索" };
const MENU_LABEL: Record<Locale, string> = { th: "เมนู", en: "Menu", zh: "菜单" };
const WISHLIST_LABEL: Record<Locale, string> = { th: "รายการที่ถูกใจ", en: "Wishlist", zh: "收藏" };
const ACCOUNT_LABEL: Record<Locale, string> = { th: "บัญชี", en: "Account", zh: "账户" };

export function SiteHeader({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const home = localizedPath(locale, "/");
  const search = localizedPath(locale, "/search");
  const wishlist = localizedPath(locale, "/wishlist");
  const account = localizedPath(locale, "/account");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      {/* Mobile */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:hidden">
        <button type="button" aria-label={MENU_LABEL[locale]} className="text-brand-dark">
          <span className="ti ti-menu-2 text-[22px]" aria-hidden="true" />
        </button>
        <LogoCompact href={home} />
        <div className="ml-auto flex items-center gap-3 text-brand-dark">
          <Link href={search} aria-label={SEARCH_LABEL[locale]}><span className="ti ti-search text-[21px]" aria-hidden="true" /></Link>
          <Link href={wishlist} aria-label={WISHLIST_LABEL[locale]}><span className="ti ti-heart text-[21px]" aria-hidden="true" /></Link>
          <LanguageSwitcher current={locale} />
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-6xl items-center gap-6 px-6 py-3 md:flex">
        <Logo variant="horizontal" height={44} href={home} />
        <form action={search} className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-line bg-bg px-4 py-2">
          <span className="ti ti-search text-[16px] text-brand" aria-hidden="true" />
          <input
            name="q"
            placeholder={SEARCH_PLACEHOLDER[locale]}
            className="w-full bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted"
            aria-label={SEARCH_LABEL[locale]}
          />
        </form>
        <nav className="flex items-center gap-5 text-sm text-text-secondary">
          <span className="border-l border-line pl-5"><LanguageSwitcher current={locale} /></span>
          <Link href={wishlist} aria-label={WISHLIST_LABEL[locale]}><span className="ti ti-heart text-[19px] text-brand-dark" aria-hidden="true" /></Link>
          <Link href={account} aria-label={ACCOUNT_LABEL[locale]}><span className="ti ti-user text-[19px] text-brand-dark" aria-hidden="true" /></Link>
        </nav>
      </div>
    </header>
  );
}
