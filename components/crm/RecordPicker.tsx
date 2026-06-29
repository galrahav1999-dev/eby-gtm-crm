"use client";

import { useRef, useState } from "react";
import { HelpTip } from "./ui";
import type { FieldDef } from "@/lib/schema/types";
import type { OptionsMap } from "@/lib/options";

const fieldBase =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary";

interface Rec {
  id: string;
  label: string;
}

/**
 * Generic foreign-key picker: searchable, submits the chosen id via a hidden
 * input. If inlineCreate, opens a modal that quick-creates the related record
 * (any object) via /api/records/[targetKey] and selects it.
 */
export function RecordPicker({
  name,
  label,
  help,
  records,
  defaultValue,
  targetKey,
  targetSingular,
  createFields = [],
  options,
  inlineCreate,
}: {
  name: string;
  label: string;
  help?: string | null;
  records: Rec[];
  defaultValue?: string | null;
  targetKey: string;
  targetSingular: string;
  createFields?: FieldDef[];
  options: OptionsMap;
  inlineCreate?: boolean;
}) {
  const [recs, setRecs] = useState<Rec[]>(records);
  const initial = records.find((r) => r.id === defaultValue);
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [query, setQuery] = useState<string>(initial?.label ?? "");
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = query ? recs.filter((r) => r.label.toLowerCase().includes(query.toLowerCase())) : recs;

  function choose(r: Rec) {
    setValue(r.id);
    setQuery(r.label);
    setOpen(false);
  }

  async function create(form: HTMLFormElement) {
    setBusy(true);
    setErr(null);
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(`/api/records/${targetKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create");
      const rec = { id: data.id, label: data.label };
      setRecs((p) => [rec, ...p]);
      choose(rec);
      setModal(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-soft">
        {label}
        <HelpTip text={help} />
      </span>
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          value={query}
          placeholder={`Search ${targetSingular.toLowerCase()}…`}
          className={fieldBase}
          onChange={(e) => {
            setQuery(e.target.value);
            setValue("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        {open && (
          <div
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-line bg-card shadow-card"
            onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
          >
            {filtered.slice(0, 100).map((r) => (
              <button key={r.id} type="button" onClick={() => choose(r)} className="block w-full px-3 py-1.5 text-left text-sm text-ink-soft hover:bg-surface-muted">
                {r.label}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-ink-muted">No matches.</div>}
            {inlineCreate && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setModal(true);
                }}
                className="block w-full border-t border-line-soft px-3 py-2 text-left text-sm text-primary hover:bg-surface-muted"
              >
                + Create new {targetSingular.toLowerCase()}{query ? ` “${query}”` : ""}
              </button>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setModal(false)}>
          <div className="card w-full max-w-md p-5" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-semibold text-ink">New {targetSingular.toLowerCase()}</h3>
            {err && <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{err}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create(e.currentTarget);
              }}
              className="space-y-3"
            >
              {createFields.map((f) => {
                const opts = f.optionsKey ? options[f.optionsKey] ?? [] : [];
                const isSelect = f.widget === "select" || f.widget === "combobox";
                return isSelect ? (
                  <select key={f.name} name={f.name} defaultValue="" className={fieldBase}>
                    <option value="">{f.label}…</option>
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={f.name}
                    name={f.name}
                    required={f.required}
                    defaultValue={f.name === createFields[0].name ? query : ""}
                    placeholder={f.label}
                    className={fieldBase}
                  />
                );
              })}
              <div className="flex items-center gap-2">
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? "Creating…" : "Create & select"}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </label>
  );
}
