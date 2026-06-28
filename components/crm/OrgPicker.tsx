"use client";

import { useRef, useState } from "react";

const fieldBase =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary";

interface Rec {
  id: string;
  label: string;
}

/**
 * Searchable organization picker. Submits the chosen org id via a hidden input.
 * Includes "Create new organization" which creates it inline (via /api/organizations)
 * and selects it, with no page change.
 */
export function OrgPicker({
  name = "org_id",
  label = "Organization",
  records,
  defaultValue,
  hint,
  orgTypes = [],
  segments = [],
}: {
  name?: string;
  label?: string;
  records: Rec[];
  defaultValue?: string | null;
  hint?: string;
  orgTypes?: string[];
  segments?: string[];
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

  async function createOrg(form: HTMLFormElement) {
    setBusy(true);
    setErr(null);
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create organization");
      const rec = { id: data.id, label: data.name };
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
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          value={query}
          placeholder="Search organizations…"
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setModal(true);
              }}
              className="block w-full border-t border-line-soft px-3 py-2 text-left text-sm text-primary hover:bg-surface-muted"
            >
              + Create new organization{query ? ` “${query}”` : ""}
            </button>
          </div>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setModal(false)}>
          <div className="card w-full max-w-md p-5" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-semibold text-ink">New organization</h3>
            {err && <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{err}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrg(e.currentTarget);
              }}
              className="space-y-3"
            >
              <input name="name" required defaultValue={query} placeholder="Organization name" className={fieldBase} />
              <div className="grid grid-cols-2 gap-3">
                <select name="org_type" defaultValue="" className={fieldBase}>
                  <option value="">Org type…</option>
                  {orgTypes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select name="segment" defaultValue="" className={fieldBase}>
                  <option value="">Segment…</option>
                  {segments.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input name="city" placeholder="City" className={fieldBase} />
                <input name="country" placeholder="Country" className={fieldBase} />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={busy} className="btn-primary">{busy ? "Creating…" : "Create & select"}</button>
                <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </label>
  );
}
