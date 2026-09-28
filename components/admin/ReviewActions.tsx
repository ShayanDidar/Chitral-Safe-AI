"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { reviewReport } from "@/services/apiClient";
import type { Report } from "@/types";

/** Approve / reject controls for admins. The API re-checks the admin role. */
export function ReviewActions({ report, onChange }: { report: Report; onChange: (r: Report) => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      onChange(await reviewReport(report.id, "approve"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        {report.review !== "approved" && (
          <button type="button" disabled={busy} onClick={() => void approve()} className={cn(btn.base, btn.primary, btn.md)}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {t("admin.approve")}
          </button>
        )}
        {report.review !== "rejected" && (
          <button type="button" disabled={busy} onClick={() => setRejecting(true)} className={cn(btn.base, btn.secondary, btn.md)}>
            <X className="size-4" aria-hidden /> {t("admin.reject")}
          </button>
        )}
      </div>
      {report.review !== "approved" && report.visibility === "confidential" && (
        <p className="max-w-xs text-end text-[11px] text-slate-500">{t("admin.confidentialApproveNote")}</p>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
      <ConfirmDialog
        open={rejecting}
        title={t("admin.rejectTitle")}
        body={t("admin.rejectBody")}
        inputLabel={t("admin.rejectReason")}
        inputPlaceholder={t("admin.rejectPlaceholder")}
        confirmLabel={t("admin.reject")}
        cancelLabel={t("common.cancel")}
        onClose={() => setRejecting(false)}
        onConfirm={async (reason) => onChange(await reviewReport(report.id, "reject", reason || undefined))}
      />
    </div>
  );
}
