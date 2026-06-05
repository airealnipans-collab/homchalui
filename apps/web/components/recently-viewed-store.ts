"use client";
// apps/web/components/recently-viewed-store.ts — recently-viewed products (localStorage). Powered by 2T9COME.
export interface RecentItem {
  href: string;
  name: string;
  image: string | null;
}

const KEY = "hc_recent";
const EVENT = "hc:recent";
const CAP = 12;

export function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function recordRecent(item: RecentItem): void {
  if (typeof window === "undefined") return;
  const cur = getRecent().filter((r) => r.href !== item.href);
  const next = [item, ...cur].slice(0, CAP);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeRecent(cb: (items: RecentItem[]) => void): () => void {
  const h = () => cb(getRecent());
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
}
