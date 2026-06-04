// apps/web/components/Logo.tsx — brand logo. หอมฉลุย — Powered by 2T9COME.
// Uses the production raster logo kit in /public/brand/production_logo (real brand artwork).
// The hand-built SVGs in /public/brand remain as the editable vector source.
// `horizontal` on desktop headers, `icon` (+ wordmark) on mobile, `stacked` for splash.
import Link from "next/link";

type Variant = "horizontal" | "stacked" | "icon";

const PROD = "/brand/production_logo";
const SRC: Record<Variant, string> = {
  horizontal: `${PROD}/logo-horizontal.png`,
  stacked: `${PROD}/logo-stacked.png`,
  icon: `${PROD}/logo-icon.png`,
};

interface Props {
  variant?: Variant;
  dark?: boolean;          // use the dark-background icon
  href?: string | null;    // wrap in a link (default "/")
  className?: string;
  height?: number;         // px
  priority?: boolean;
}

export function Logo({ variant = "horizontal", dark = false, href = "/", className, height = 40 }: Props) {
  const src = variant === "icon" && dark ? `${PROD}/logo-icon-dark.png` : SRC[variant];
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt="หอมฉลุย" height={height} style={{ height }} className={className} />;
  return href ? <Link href={href} aria-label="หอมฉลุย — หน้าแรก">{img}</Link> : img;
}

/** Icon + short Thai wordmark — for compact (mobile) headers. */
export function LogoCompact({ dark = false, href = "/" }: { dark?: boolean; href?: string | null }) {
  const inner = (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark ? `${PROD}/logo-icon-dark.png` : `${PROD}/logo-icon.png`} alt="" height={30} style={{ height: 30 }} />
      <span className="text-lg font-medium text-brand-dark">หอมฉลุย</span>
    </span>
  );
  return href ? <Link href={href} aria-label="หอมฉลุย — หน้าแรก">{inner}</Link> : inner;
}
