"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/LanguageProvider";

/** Relative time that refreshes every minute. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [, tick] = useState(0);
  const { ago, lang } = useI18n();
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <time dateTime={iso} title={formatDateTime(iso, lang)} className={className} suppressHydrationWarning>
      {ago(iso)}
    </time>
  );
}
