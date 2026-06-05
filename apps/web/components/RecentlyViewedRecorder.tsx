"use client";
// apps/web/components/RecentlyViewedRecorder.tsx — records the current product on view. Powered by 2T9COME.
import { useEffect } from "react";
import { recordRecent } from "./recently-viewed-store";

export function RecentlyViewedRecorder({ href, name, image }: { href: string; name: string; image: string | null }) {
  useEffect(() => {
    recordRecent({ href, name, image });
  }, [href, name, image]);
  return null;
}
