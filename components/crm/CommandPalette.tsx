"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REGISTRY } from "@/lib/schema/registry";
import type { SearchHit } from "@/app/api/search/route";

interface Item {
  type: "record" | "action";
  label: string;
  sub: string;
  href: string;
  object?: string; // for actions: which object to quick-add
}

const OBJECTS = Object.values(REGISTRY).map((d) => ({ key: d.key, singular: d.singular, label: d.label }));

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // The "New X" actions, filtered by what the user has typed.
  const actions = useMemo<Item[]>(() => {
    const needle = q.trim().toLowerCase();
    return OBJECTS.filter((o) => !needle || o.label.toLowerCase().includes(needle) || o.singular.toLowerCase().includes(needle)).map(
      (o) => ({ type: "action", label: `New ${o.singular.toLowerCase()}`, sub: o.label, href: `/${o.key}/new`, object: o.key })
    );
  }, [q]);

  const items = useMemo<Item[]>(() => {
    const records: Item[] = hits.map((h) => ({
      type: "record",
      label: h.title,
      sub: `${h.objectLabel}${h.displayId ? " · " + h.displayId : ""}`,
      href: h.href,
    }));
    // With a query: matched records first, then a couple of create actions.
    // Empty: just the create actions, so the palette is also a quick-add menu.
    return q.trim().length >= 2 ? [...records, ...actions] : actions;
  }, [hits, actions, q]);

  useEffect(() => setActive(0), [items.length]);

  // Global open shortcut (Cmd/Ctrl+K) and close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setActive(0);
      // Focus after the overlay paints.
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced cross-object search.
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: ctrl.signal });
        const json = await res.json();
        setHits(json.hits ?? []);
      } catch {
        /* aborted or failed; leave prior hits */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const choose = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      setOpen(false);
      // Actions open the quick-add drawer; records navigate to the record.
      if (item.type === "action" && item.object) {
        window.dispatchEvent(new CustomEvent("eby:quickadd", { detail: { object: item.object } }));
      } else {
        router.push(item.href);
      }
    },
    [router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(items[active]);
    }
  }

  return (
    <>
      {/* Trigger in the topbar */}
      <button
        onClick={() => setOpen(true)}
        title="Search and quick add (press Cmd or Ctrl + K)"
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs text-ink-muted transition hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search or add</span>
        <kbd className="hidden rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-ink-muted ring-1 ring-line sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true">
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
            style={{ background: "color-mix(in srgb, var(--ink) 40%, transparent)" }}
          />
          <div className="card animate-rise relative w-full max-w-xl overflow-hidden p-0 shadow-pop">
            <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-ink-muted">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search people, orgs, deals… or type to add a record"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              {loading && <span className="text-[11px] text-ink-muted">Searching…</span>}
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {q.trim().length >= 2 ? `No matches for “${q.trim()}”.` : "Start typing to search."}
                </div>
              ) : (
                items.map((item, i) => (
                  <button
                    key={`${item.type}-${item.href}-${i}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === active ? "bg-surface-muted" : ""
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
                        item.type === "action" ? "bg-primary-soft text-primary" : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      {item.type === "action" ? "+" : "›"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                      <span className="block truncate text-xs text-ink-muted">{item.sub}</span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line-soft px-4 py-2 text-[11px] text-ink-muted">
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
