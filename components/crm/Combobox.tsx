"use client";

import { useRef, useState } from "react";
import { HelpTip } from "./ui";

const fieldBase =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-muted outline-none transition focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary";

/**
 * Searchable single-select. Submits its value via a hidden input named `name`.
 * If `fieldKey` is provided, users can add a brand-new value inline (it is saved
 * to the editable field_options list so it persists for everyone).
 */
export function Combobox({
  name,
  label,
  options,
  defaultValue,
  required,
  placeholder = "Search…",
  hint,
  help,
  fieldKey,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  help?: string | null;
  fieldKey?: string;
}) {
  const [opts, setOpts] = useState<string[]>(
    defaultValue && !options.includes(defaultValue) ? [defaultValue, ...options] : options
  );
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [query, setQuery] = useState<string>(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = query
    ? opts.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : opts;
  const canAdd =
    !!fieldKey && query.trim().length > 0 && !opts.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  function choose(v: string) {
    setValue(v);
    setQuery(v);
    setOpen(false);
  }

  async function addNew() {
    const v = query.trim();
    if (!v || !fieldKey) return;
    setBusy(true);
    try {
      await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_key: fieldKey, value: v }),
      });
    } catch {
      /* even if save fails, let them use it for this record */
    }
    setOpts((prev) => [v, ...prev]);
    choose(v);
    setBusy(false);
  }

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-rose-400">*</span>}
        <HelpTip text={help} />
      </span>
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          value={query}
          required={required && !value}
          placeholder={placeholder}
          className={fieldBase}
          onChange={(e) => {
            setQuery(e.target.value);
            setValue(""); // typing clears the committed value until they pick
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setQuery("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink-soft"
          >
            clear
          </button>
        )}

        {open && (
          <div
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-line bg-card shadow-card"
            onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
          >
            {filtered.slice(0, 100).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => choose(o)}
                className="block w-full px-3 py-1.5 text-left text-sm text-ink-soft hover:bg-surface-muted"
              >
                {o}
              </button>
            ))}
            {filtered.length === 0 && !canAdd && (
              <div className="px-3 py-2 text-sm text-ink-muted">No matches.</div>
            )}
            {canAdd && (
              <button
                type="button"
                onClick={addNew}
                disabled={busy}
                className="block w-full border-t border-line-soft px-3 py-2 text-left text-sm text-primary hover:bg-surface-muted"
              >
                {busy ? "Adding…" : `+ Add “${query.trim()}”`}
              </button>
            )}
          </div>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
