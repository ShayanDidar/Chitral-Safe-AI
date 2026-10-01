"use client";

import { Mail, MessageSquare, Phone, TriangleAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { EmergencyContact } from "@/types";

const ICONS = { phone: Phone, sms: MessageSquare, email: Mail } as const;
const KIND_KEY = { phone: "contact.kind.phone", sms: "contact.kind.sms", email: "contact.kind.email" } as const;
const ACTION_KEY = { phone: "contact.call", sms: "contact.text", email: "contact.email" } as const;

/** tel:/sms:/mailto: link that opens the device's calling, messaging or email app. */
function contactHref(c: EmergencyContact) {
  const clean = c.value.replace(/[^\d+]/g, "");
  if (c.kind === "phone") return `tel:${clean}`;
  if (c.kind === "sms") return `sms:${clean}`;
  return `mailto:${c.value}`;
}

export function ContactLink({ contact, compact = false }: { contact: EmergencyContact; compact?: boolean }) {
  const { t } = useI18n();
  const Icon = ICONS[contact.kind];
  return (
    <a
      href={contactHref(contact)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold ring-1 ring-inset transition-colors",
        contact.kind === "phone" ? "bg-red-600 text-white ring-red-600 hover:bg-red-700" : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50",
        compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {t(ACTION_KEY[contact.kind])}
      {!compact && (
        <span dir="ltr" className="font-medium opacity-90">
          {contact.value}
        </span>
      )}
    </a>
  );
}

/** Honest reminder shown wherever reports are submitted or contacts are listed. */
export function NotEmergencyNotice({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={cn("flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-600/15", className)}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t("emergency.notice")}
    </p>
  );
}

export function EmergencyContactList({ variant = "full" }: { variant?: "full" | "sidebar" }) {
  const { contacts, offline } = useAppStore();
  const { t, lang } = useI18n();
  const labelOf = (c: EmergencyContact) => (lang === "ur" && c.labelUr ? c.labelUr : c.label);

  if (!contacts.length) {
    return <p className="text-xs text-slate-500">{t(offline ? "emergency.offline" : "emergency.none")}</p>;
  }

  if (variant === "sidebar") {
    return (
      <ul className="space-y-1.5">
        {contacts.slice(0, 4).map((c) => {
          const Icon = ICONS[c.kind];
          return (
            <li key={c.id}>
              <a
                href={contactHref(c)}
                className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-200 hover:bg-red-50"
              >
                <Icon className={cn("size-3.5 shrink-0", c.kind === "phone" ? "text-red-700" : "text-slate-500")} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-slate-700">{labelOf(c)}</span>
                <span dir="ltr" className="font-semibold text-red-700">
                  {c.value}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {contacts.map((c) => {
        const Icon = ICONS[c.kind];
        return (
          <li key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", c.kind === "phone" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{labelOf(c)}</p>
              <p className="text-xs text-slate-500">
                {t(KIND_KEY[c.kind])} · {c.region}
                {c.note ? ` · ${c.note}` : ""}
              </p>
            </div>
            <ContactLink contact={c} />
          </li>
        );
      })}
    </ul>
  );
}
