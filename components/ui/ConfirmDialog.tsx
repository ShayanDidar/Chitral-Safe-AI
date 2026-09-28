"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn } from "./primitives";

/**
 * Accessible confirmation dialog built on <dialog>. Optionally collects a
 * short text (e.g. a rejection reason).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  inputLabel,
  inputPlaceholder,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "primary";
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (input: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(value.trim());
      setValue("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !busy && onClose()}
      className="m-auto w-[min(92vw,420px)] rounded-2xl bg-white p-0 shadow-float backdrop:bg-slate-900/40"
    >
      <div className="p-5">
        <h2 id={`${id}-title`} className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {body && <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</div>}
        {inputLabel && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-700">{inputLabel}</span>
            <textarea
              dir="auto"
              rows={3}
              maxLength={500}
              value={value}
              placeholder={inputPlaceholder}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <button type="button" disabled={busy} onClick={onClose} className={cn(btn.base, btn.secondary, btn.md)}>
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className={cn(btn.base, btn.md, tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : btn.primary)}
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
