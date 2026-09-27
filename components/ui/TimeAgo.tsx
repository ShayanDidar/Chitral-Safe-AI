"use client";

import { useEffect, useState } from "react";
import { formatDateTime, timeAgo } from "@/lib/utils";

/** Relative time that refreshes every minute. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className} suppressHydrationWarning>
      {timeAgo(iso)}
    </time>
  );
}
