"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Card, btn } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ContactLink } from "@/components/emergency/EmergencyContacts";
import {
  ApiError,
  createContact,
  deleteContact,
  fetchAllContacts,
  fetchContacts,
  updateContact,
  type ContactInput,
} from "@/lib/api";
import type { EmergencyContact } from "@/types";

const inputCls =
  "mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const EMPTY: ContactInput = { region: "Chitral", label: "", labelUr: "", kind: "phone", value: "", note: "", sort: 10, active: true };

/** Admin management of the emergency contacts shown across the app. */
export function AdminContacts() {
  const { t } = useI18n();
  const { setContacts } = useAppStore();
  const [contacts, setAll] = useState<EmergencyContact[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; data: ContactInput } | null>(null);
  const [deleting, setDeleting] = useState<EmergencyContact | null>(null);

  const reload = async () => {
    setAll(await fetchAllContacts());
    // Refresh the public list used by the sidebar and emergency page.
    setContacts(await fetchContacts());
  };

  useEffect(() => {
    fetchAllContacts()
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-600">{t("admin.contactsHelp")}</p>
        <button type="button" onClick={() => setEditing({ id: null, data: EMPTY })} className={cn(btn.base, btn.primary, btn.md)}>
          <Plus className="size-4" aria-hidden /> {t("admin.addContact")}
        </button>
      </div>

      {editing && (
        <ContactForm
          initial={editing.data}
          isNew={!editing.id}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            if (editing.id) await updateContact(editing.id, data);
            else await createContact(data);
            setEditing(null);
            await reload();
          }}
        />
      )}

      {!contacts ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="size-6 animate-spin text-slate-400" aria-label={t("common.loading")} />
        </div>
      ) : (
        <Card className="divide-y divide-slate-100">
          {contacts.length === 0 && <p className="p-6 text-center text-sm text-slate-500">{t("admin.noContacts")}</p>}
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                  {!c.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{t("admin.inactive")}</span>}
                </div>
                <p className="text-xs text-slate-500">
                  {c.region} · {t(({ phone: "contact.kind.phone", sms: "contact.kind.sms", email: "contact.kind.email" } as const)[c.kind])} · <span dir="ltr">{c.value}</span>
                </p>
                {c.note && <p className="mt-0.5 text-xs text-slate-500">{c.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <ContactLink contact={c} compact />
                <button
                  type="button"
                  onClick={() => setEditing({ id: c.id, data: { ...c, labelUr: c.labelUr ?? "", note: c.note ?? "" } })}
                  className={cn(btn.base, btn.ghost, btn.sm)}
                  aria-label={t("admin.edit")}
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => setDeleting(c)} className={cn(btn.base, btn.ghost, btn.sm, "text-red-700")} aria-label={t("delete.button")}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={t("admin.deleteContactTitle")}
        body={deleting?.label}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("common.cancel")}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteContact(deleting.id);
          await reload();
        }}
      />
    </div>
  );
}

function ContactForm({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: ContactInput;
  isNew: boolean;
  onSave: (c: ContactInput) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<ContactInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ContactInput>(k: K, v: ContactInput[K]) => setData((d) => ({ ...d, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({ ...data, labelUr: data.labelUr || null, note: data.note || null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <p className="text-sm font-semibold text-slate-900 sm:col-span-2">{t(isNew ? "admin.addContact" : "admin.editContact")}</p>
        <label>
          <span className="text-xs font-medium text-slate-700">{t("admin.contactLabel")}</span>
          <input required maxLength={120} value={data.label} onChange={(e) => set("label", e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-700">{t("admin.contactLabelUr")}</span>
          <input dir="rtl" maxLength={120} value={data.labelUr ?? ""} onChange={(e) => set("labelUr", e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-700">{t("admin.contactKind")}</span>
          <select value={data.kind} onChange={(e) => set("kind", e.target.value as ContactInput["kind"])} className={inputCls}>
            <option value="phone">{t("contact.kind.phone")}</option>
            <option value="sms">{t("contact.kind.sms")}</option>
            <option value="email">{t("contact.kind.email")}</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-medium text-slate-700">{t(data.kind === "email" ? "auth.email" : "admin.contactNumber")}</span>
          <input
            required
            dir="ltr"
            maxLength={200}
            type={data.kind === "email" ? "email" : "tel"}
            value={data.value}
            onChange={(e) => set("value", e.target.value)}
            className={inputCls}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-700">{t("admin.contactRegion")}</span>
          <input required maxLength={80} value={data.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-700">{t("admin.contactOrder")}</span>
          <input type="number" min={0} max={999} value={data.sort} onChange={(e) => set("sort", Number(e.target.value))} className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs font-medium text-slate-700">{t("admin.contactNote")}</span>
          <input maxLength={300} value={data.note ?? ""} onChange={(e) => set("note", e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={data.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-brand-700" />
          {t("admin.contactActive")}
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onCancel} className={cn(btn.base, btn.secondary, btn.md)}>
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={busy} className={cn(btn.base, btn.primary, btn.md)}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t("profile.save")}
          </button>
        </div>
      </form>
    </Card>
  );
}
