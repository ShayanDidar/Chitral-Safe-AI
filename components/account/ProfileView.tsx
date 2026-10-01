"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Camera, Check, Loader2, Lock, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";
import { Avatar, Card, PageHeader, btn } from "@/components/ui/primitives";
import { ApiError, logout, removeAvatar, updateProfile, uploadAvatar } from "@/lib/api";
import { AccountTabs } from "./AccountTabs";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function ProfileView() {
  const { user, setUser } = useAppStore();
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(user?.contactEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!user) return null;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      setUser(await updateProfile({ name, bio, phone, contactEmail }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarError(null);
    // Checked again on the server, which decodes and re-encodes the image.
    if (!ACCEPTED.includes(file.type)) return setAvatarError(t("profile.avatarType"));
    if (file.size > MAX_BYTES) return setAvatarError(t("profile.avatarSize"));
    setAvatarBusy(true);
    try {
      const { blob, previewUrl } = await compressImage(file, 512, 0.85);
      URL.revokeObjectURL(previewUrl);
      setUser(await uploadAvatar(blob));
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : t("err.image"));
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onRemoveAvatar() {
    setAvatarBusy(true);
    try {
      setUser(await removeAvatar());
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onSignOut() {
    await logout();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("account.title")}
        subtitle={user.email}
        action={
          <button type="button" onClick={() => void onSignOut()} className={cn(btn.base, btn.secondary, btn.md)}>
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden /> {t("auth.signOut")}
          </button>
        }
      />
      <AccountTabs />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative">
            <Avatar name={user.name} src={user.avatarUrl} className="size-20 text-xl" />
            {avatarBusy && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70">
                <Loader2 className="size-5 animate-spin text-slate-500" aria-hidden />
              </span>
            )}
          </div>
          <div className="text-center sm:text-start">
            <p className="text-base font-semibold text-slate-900">{user.name}</p>
            {user.role === "admin" && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                <ShieldCheck className="size-3" aria-hidden /> {t("account.adminBadge")}
              </span>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <input
                ref={fileRef}
                id="avatar"
                type="file"
                accept={ACCEPTED.join(",")}
                className="sr-only"
                onChange={(e) => void onAvatar(e.target.files?.[0])}
              />
              <label htmlFor="avatar" className={cn(btn.base, btn.secondary, btn.sm, "cursor-pointer")}>
                <Camera className="size-3.5" aria-hidden /> {t(user.avatarUrl ? "profile.changePhoto" : "profile.uploadPhoto")}
              </label>
              {user.avatarUrl && (
                <button type="button" disabled={avatarBusy} onClick={() => void onRemoveAvatar()} className={cn(btn.base, btn.ghost, btn.sm, "text-red-700")}>
                  <Trash2 className="size-3.5" aria-hidden /> {t("report.remove")}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">{t("profile.photoHint")}</p>
            {avatarError && <p className="mt-1 text-xs font-medium text-red-700">{avatarError}</p>}
          </div>
        </div>
      </Card>

      <form onSubmit={onSave}>
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("profile.public")}</p>
            <p className="text-xs text-slate-500">{t("profile.publicHelp")}</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">{t("profile.name")}</span>
            <input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={cn(inputCls, "h-11")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">{t("profile.bio")}</span>
            <textarea
              rows={3}
              maxLength={300}
              dir="auto"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bioPlaceholder")}
              className={cn(inputCls, "resize-y py-2.5")}
            />
            <span className="mt-1 block text-end text-[11px] tabular-nums text-slate-400">{bio.length}/300</span>
          </label>

          <div className="border-t border-slate-100 pt-5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Lock className="size-3.5" aria-hidden /> {t("profile.private")}
            </p>
            <p className="text-xs text-slate-500">{t("profile.privateHelp")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">{t("profile.phone")}</span>
              <input
                type="tel"
                dir="ltr"
                maxLength={25}
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 …"
                className={cn(inputCls, "h-11")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">{t("profile.contactEmail")}</span>
              <input
                type="email"
                dir="ltr"
                maxLength={200}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={cn(inputCls, "h-11")}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <Check className="size-4" aria-hidden /> {t("profile.saved")}
              </span>
            )}
            <button type="submit" disabled={saving} className={cn(btn.base, btn.primary, btn.md)}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("profile.save")}
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
