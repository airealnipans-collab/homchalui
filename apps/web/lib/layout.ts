// apps/web/lib/layout.ts
// Front layout reads + custom_html sanitization. หอมฉลุย — Powered by 2T9COME.
// Only PUBLISHED layout pages render; sections are active-only, ordered. Cached in Redis.
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";
import sanitizeHtml from "sanitize-html";
import type { Locale } from "@homchalui/i18n";

export interface RawSection {
  id: string;
  type: string;
  config: unknown;
}

export function getLayoutSections(key: string, locale: Locale): Promise<RawSection[] | null> {
  return withCache(
    `cache:layout:${key}:${locale}`,
    120,
    async () => {
      const page = await db.layoutPage.findUnique({
        where: { key_locale: { key, locale } },
        select: {
          status: true,
          sections: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, type: true, config: true } },
        },
      });
      if (!page || page.status !== "published") return null;
      return page.sections.map((s) => ({ id: s.id, type: s.type, config: s.config }));
    },
    [`layout:${key}:${locale}`],
  );
}

/** Sanitize admin-authored custom_html before render (defense-in-depth even though it's RBAC'd). */
export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "section", "span"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class"],
      img: ["src", "alt", "width", "height", "loading"],
      a: ["href", "rel", "target"],
    },
    allowedSchemes: ["https", "http", "mailto"],
  });
}
