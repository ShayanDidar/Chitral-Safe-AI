export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function minutesSince(iso: string, now = Date.now()) {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
}

export function formatDateTime(iso: string, lang: "en" | "ur" = "en") {
  return new Date(iso).toLocaleString(lang === "ur" ? "ur-PK" : "en-GB", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
