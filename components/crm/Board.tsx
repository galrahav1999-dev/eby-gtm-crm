"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ownerColor } from "@/lib/colors";
import { fmtDate, isOverdue } from "@/lib/format";
import { OwnerAvatar, HelpTip } from "./ui";
import { setStage } from "@/app/(app)/board-actions";

export interface BoardCard {
  id: string;
  displayId: string | null;
  title: string;
  org: string | null;
  owner: string | null;
  priority: string | null;
  value: number | null;
  stage: string | null;
  nextStepDate: string | null;
}

const UNSTAGED = "__unstaged__";

function money(n: number | null): string | null {
  if (n == null) return null;
  return `$${n.toLocaleString()}`;
}

export function Board({
  cards: initial,
  stages,
  guide,
  basePath,
  objectKey,
}: {
  cards: BoardCard[];
  stages: string[];
  guide: Record<string, string>;
  basePath: string;
  objectKey: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<BoardCard[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dragKindRef = useRef<string | null>(null);

  // Show a leading "No stage" column only if some records have an unknown stage.
  const columns = useMemo(() => {
    const known = new Set(stages);
    const hasUnstaged = cards.some((c) => !c.stage || !known.has(c.stage));
    return hasUnstaged ? [UNSTAGED, ...stages] : stages;
  }, [cards, stages]);

  const byStage = useMemo(() => {
    const known = new Set(stages);
    const m = new Map<string, BoardCard[]>();
    for (const s of columns) m.set(s, []);
    for (const c of cards) {
      const key = c.stage && known.has(c.stage) ? c.stage : UNSTAGED;
      (m.get(key) ?? m.get(stages[0])!).push(c);
    }
    return m;
  }, [cards, columns, stages]);

  function onDrop(targetStage: string) {
    setOverStage(null);
    const id = dragKindRef.current;
    dragKindRef.current = null;
    setDragId(null);
    if (!id || targetStage === UNSTAGED) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === targetStage) return;

    const prev = card.stage;
    // Optimistic move; revert if the server rejects it.
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage: targetStage } : c)));
    setError(null);
    startTransition(async () => {
      const res = await setStage(objectKey, id, targetStage);
      if (!res.ok) {
        setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage: prev } : c)));
        setError(res.error ?? "Could not move the card. Try again.");
      }
    });
  }

  return (
    <div>
      {error && (
        <div
          className="mb-3 rounded-xl px-3 py-2 text-sm text-danger"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
        >
          {error}
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: columns.length * 250 }}>
          {columns.map((stage) => {
            const list = byStage.get(stage) ?? [];
            const total = list.reduce((s, c) => s + (c.value ?? 0), 0);
            const isUn = stage === UNSTAGED;
            const over = overStage === stage;
            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  if (isUn) return;
                  e.preventDefault();
                  setOverStage(stage);
                }}
                onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
                onDrop={() => onDrop(stage)}
                className="flex w-[240px] shrink-0 flex-col rounded-2xl border bg-surface-muted transition"
                style={{
                  borderColor: over ? "var(--primary)" : "var(--line)",
                  boxShadow: over ? "0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)" : "none",
                }}
              >
                <div className="flex items-center justify-between gap-2 px-3 pt-3">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-sm font-semibold text-ink">
                      {isUn ? "No stage" : stage}
                    </span>
                    {!isUn && guide[stage] && <HelpTip text={guide[stage]} />}
                  </div>
                  <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-ink-muted ring-1 ring-line">
                    {list.length}
                  </span>
                </div>
                <div className="px-3 pb-2 pt-0.5 text-[11px] text-ink-muted">
                  {total > 0 ? money(total) : isUn ? "Drag a card onto a stage" : "—"}
                </div>

                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {list.map((c) => (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={() => {
                        dragKindRef.current = c.id;
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        dragKindRef.current = null;
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => router.push(`${basePath}/${c.id}`)}
                      className="group cursor-pointer rounded-xl border border-line bg-card p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: ownerColor(c.owner),
                        opacity: dragId === c.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="line-clamp-2 text-sm font-medium text-ink group-hover:text-primary"
                          title={c.title}
                        >
                          {c.title}
                        </span>
                        {c.owner && <OwnerAvatar owner={c.owner} size={20} />}
                      </div>

                      {c.org && (
                        <div className="mt-1 truncate text-xs text-ink-muted" title={c.org}>
                          {c.org}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                        {c.value != null && (
                          <span className="font-medium text-ink-soft">{money(c.value)}</span>
                        )}
                        {c.priority && (
                          <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-ink-muted">
                            {c.priority}
                          </span>
                        )}
                        {c.nextStepDate && (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isOverdue(c.nextStepDate) ? "font-medium text-danger" : "text-ink-muted"
                            }`}
                            title={isOverdue(c.nextStepDate) ? "Follow-up due" : "Next step"}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: isOverdue(c.nextStepDate) ? "var(--danger)" : "var(--ink-muted)",
                              }}
                            />
                            {fmtDate(c.nextStepDate)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}

                  {list.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line px-2 py-6 text-center text-[11px] text-ink-muted">
                      {isUn ? "Nothing here" : "Drop a card here"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
