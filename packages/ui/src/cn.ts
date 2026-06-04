// packages/ui/src/cn.ts — tiny className combiner. หอมฉลุย — Powered by 2T9COME.
// Dependency-free: joins truthy class fragments with a space. Keeps shared components from
// each owning a clsx copy. For conditional classes pass `cond && "class"`.
export type ClassValue = string | number | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
