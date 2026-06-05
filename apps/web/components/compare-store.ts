"use client";
// apps/web/components/compare-store.ts — compare tray persistence (localStorage). Powered by 2T9COME.
// Holds up to 4 product ids client-side; the /compare page reads ids from the URL.
export interface CompareItem {
  id: string;
  name: string;
}

const KEY = "hc_compare";
const EVENT = "hc:compare";
export const COMPARE_MAX = 4;

export function getCompare(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CompareItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CompareItem[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/** Returns false if not added (already present or tray full). */
export function addToCompare(item: CompareItem): boolean {
  const cur = getCompare();
  if (cur.some((c) => c.id === item.id)) return false;
  if (cur.length >= COMPARE_MAX) return false;
  save([...cur, item]);
  return true;
}

export function removeFromCompare(id: string): void {
  save(getCompare().filter((c) => c.id !== id));
}

export function clearCompare(): void {
  save([]);
}

export function subscribeCompare(cb: (items: CompareItem[]) => void): () => void {
  const handler = () => cb(getCompare());
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
