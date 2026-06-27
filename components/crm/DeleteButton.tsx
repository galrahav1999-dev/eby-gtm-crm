"use client";

import { useState } from "react";

/**
 * Confirm-then-delete. Wraps a bound server action; shows an inline confirm so
 * a misclick never destroys a record.
 */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this record permanently?",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn-danger">
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{confirmText}</span>
      <button type="submit" className="btn-danger">
        Yes, delete
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="btn-ghost text-xs">
        Cancel
      </button>
    </form>
  );
}
