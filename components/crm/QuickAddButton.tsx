"use client";

/**
 * Opens the quick-add drawer for an object, optionally prefilling fields (used on
 * detail pages to add a linked record with the link back already set, e.g. add a
 * person to this organization).
 */
export function QuickAddButton({
  object,
  prefill,
  label,
  className = "btn-ghost text-xs",
}: {
  object: string;
  prefill?: Record<string, string>;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("eby:quickadd", { detail: { object, prefill } }))}
      className={className}
    >
      {label}
    </button>
  );
}
