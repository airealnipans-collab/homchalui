// apps/web/app/api/categories/route.ts
// GET /api/categories — localized category list or tree. หอมฉลุย — Powered by 2T9COME.
// Published-translation-only: a category with no translation in `locale` is omitted (no Thai
// fallback). `tree=true` nests children under parents. Cached in Redis. See API_CONTRACTS.md.
import { NextRequest } from "next/server";
import { categoryQuery, queryToObject } from "@homchalui/validators";
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";
import type { Locale } from "@homchalui/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  children?: CategoryNode[];
}

const CATEGORIES_TTL = 300; // seconds

async function loadCategories(locale: Locale, tree: boolean): Promise<CategoryNode[]> {
  const rows = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      parentId: true,
      icon: true,
      translations: { where: { locale }, select: { name: true, slug: true } },
    },
  });

  // Keep only categories that actually have a translation in this locale.
  const flat: CategoryNode[] = rows
    .filter((c) => c.translations[0])
    .map((c) => ({
      id: c.id,
      name: c.translations[0]!.name,
      slug: c.translations[0]!.slug,
      icon: c.icon,
      parentId: c.parentId,
    }));

  if (!tree) return flat;

  const byId = new Map(flat.map((c) => [c.id, { ...c, children: [] as CategoryNode[] }]));
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function GET(req: NextRequest) {
  const parsed = categoryQuery.safeParse(queryToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_query", message: "Invalid query parameters", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  const { locale, tree } = parsed.data;
  const items = await withCache(
    `cache:categories:${locale}:${tree ? "tree" : "flat"}`,
    CATEGORIES_TTL,
    () => loadCategories(locale, tree),
    [`categories:${locale}`],
  );

  return Response.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
