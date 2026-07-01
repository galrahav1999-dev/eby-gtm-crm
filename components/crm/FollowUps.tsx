"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OwnerAvatar } from "./ui";
import { fmtDate } from "@/lib/format";
import type { FollowUp } from "@/app/api/followups/route";

export function FollowUps() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FollowUp[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; kind: "logged" | "vetoed" } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/followups");
      const json = await res.json();
      setItems(json.items ?? []);
      setCount((json.items ?? []).length);
    } catch {
      setItems([]);
    }
  }

  // A quiet count on mount so the badge shows how many are due.
  useEffect(() => {
    fetch("/api/followups")
      .then((r) => r.json())
      .then((j) => setCount((j.items ?? []).length))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    if (open && items === null) load();
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function remove(id: string, kind: "logged" | "vetoed") {
    setItems((xs) => (xs ? xs.filter((x) => x.id !== id) : xs));
    setCount((c) => (c == null ? c : Math.max(0, c - 1)));
    setDone({ id, kind });
    setTimeout(() => setDone(null), 3500);
  }

  async function logInteraction(it: FollowUp) {
    setBusy(it.id);
    try {
      const payload: Record<string, string> = {
        date: new Date().toISOString().slice(0, 10),
        type: "Email",
        outcome: edits[it.id] ?? it.body,
      };
      if (it.owner) payload.owner = it.owner;
      if (it.orgId) payload.org_id = it.orgId;
      if (it.object === "people") payload.person_id = it.id;
      else payload.deal_id = it.id;

      const res = await fetch("/api/records/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      remove(it.id, "logged");
      router.refresh();
    } catch {
      /* leave the card so the user can retry */
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Follow-ups due"
        className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs text-ink-soft transition hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Follow-ups</span>
        {count != null && count > 0 && (
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-contrast">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" style={{ background: "color-mix(in srgb, var(--ink) 40%, transparent)" }} />
          <div className="animate-rise relative flex h-full w-full max-w-[460px] flex-col border-l border-line bg-card shadow-pop">
            <div className="border-b border-line-soft px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="label-eyebrow">Follow-up autopilot</div>
                  <h2 className="text-base font-semibold text-ink">AI drafts the outreach. You stay in control.</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-sm text-ink-muted hover:text-ink">Close</button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-soft" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-primary">
                  <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2ZM8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Nothing is sent in your name. Choosing Log records it as an interaction, never an email.
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {items === null ? (
                <div className="space-y-3">
                  <div className="skeleton h-28 w-full rounded-xl" />
                  <div className="skeleton h-28 w-full rounded-xl" />
                </div>
              ) : items.length === 0 ? (
                <div className="px-3 py-14 text-center text-sm text-ink-muted">
                  Nothing due. Follow-ups appear here when a next-step date is today or past.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => (
                    <article key={it.id} className="rounded-xl border border-line bg-surface-muted p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => router.push(it.href)} className="flex min-w-0 items-center gap-2 text-left">
                          <OwnerAvatar owner={it.owner} size={22} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink hover:text-primary">{it.title}</span>
                            <span className="block text-[11px] text-ink-muted">{it.object === "people" ? "Person" : "Deal"} · {it.owner ?? "no owner"}</span>
                          </span>
                        </button>
                        <span className={`shrink-0 text-[11px] font-medium ${it.overdue ? "text-danger" : "text-ink-muted"}`}>
                          {it.overdue ? "Overdue " : "Due "}{fmtDate(it.dueDate)}
                        </span>
                      </div>

                      <div className="mt-2.5 rounded-lg border border-line bg-card p-2.5">
                        <div className="label-eyebrow mb-1">Subject</div>
                        <div className="text-sm text-ink">{it.subject}</div>
                        <div className="label-eyebrow mb-1 mt-2.5">Draft</div>
                        {editing === it.id ? (
                          <textarea
                            value={edits[it.id] ?? it.body}
                            onChange={(e) => setEdits((m) => ({ ...m, [it.id]: e.target.value }))}
                            rows={6}
                            className="w-full resize-y rounded-md border border-line bg-field px-2.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <p className="whitespace-pre-line text-sm text-ink-soft">{edits[it.id] ?? it.body}</p>
                        )}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => logInteraction(it)}
                          disabled={busy === it.id}
                          className="btn-primary text-xs"
                        >
                          {busy === it.id ? "Logging…" : "Log as interaction"}
                        </button>
                        <button onClick={() => setEditing(editing === it.id ? null : it.id)} className="btn-ghost text-xs">
                          {editing === it.id ? "Done editing" : "Edit"}
                        </button>
                        <button onClick={() => remove(it.id, "vetoed")} className="btn-ghost text-xs text-ink-muted">
                          Veto
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {done && (
                <div className="mt-3 rounded-lg px-3 py-2 text-xs text-ink-soft" style={{ background: "color-mix(in srgb, var(--growth) 12%, transparent)" }}>
                  {done.kind === "logged" ? "Logged as an interaction." : "Dismissed from the queue."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
