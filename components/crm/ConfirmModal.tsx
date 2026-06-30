"use client";

import { useEffect } from "react";

/**
 * Reusable confirmation dialog for actions that are hard to undo. Backdrop click
 * or Escape cancels. Use for archive, discard, remove-key, and similar.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={onCancel}>
      <div className="card w-full max-w-sm p-5 animate-rise" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-ink-soft">{message}</p>}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={danger ? "btn-danger" : "btn-primary"}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
