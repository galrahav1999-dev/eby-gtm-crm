"use client";

import { useState, useTransition } from "react";
import { ConfirmModal } from "./ConfirmModal";

/**
 * Confirm-then-run for a hard-to-undo action. Opens a styled confirmation modal
 * so a misclick never archives or discards a record.
 */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "This cannot be easily undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-danger">
        {label}
      </button>
      <ConfirmModal
        open={open}
        title={`${label}?`}
        message={confirmText}
        confirmLabel={`Yes, ${label.toLowerCase()}`}
        danger
        busy={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => start(async () => { await action(); })}
      />
    </>
  );
}
