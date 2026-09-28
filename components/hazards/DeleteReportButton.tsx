"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { btn } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Report } from "@/types";

/**
 * Delete button shown to the report's owner and to admins. The server
 * enforces the same rule; this only decides whether to show the button.
 */
export function DeleteReportButton({
  report,
  onDeleted,
  compact = false,
  className,
}: {
  report: Report;
  onDeleted?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const { user, deleteReport } = useHazardStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!user || (!report.mine && user.role !== "admin")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          compact
            ? "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 hover:bg-red-50"
            : cn(btn.base, btn.secondary, btn.md, "text-red-700"),
          className,
        )}
      >
        <Trash2 className="size-4" aria-hidden />
        <span className={compact ? "hidden sm:inline" : undefined}>{t("delete.button")}</span>
      </button>
      <ConfirmDialog
        open={open}
        title={t("delete.title")}
        body={report.mine ? t("delete.bodyOwn") : t("delete.bodyAdmin")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("common.cancel")}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          await deleteReport(report.id);
          onDeleted?.();
        }}
      />
    </>
  );
}
