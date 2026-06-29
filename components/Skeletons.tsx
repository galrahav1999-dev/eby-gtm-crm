"use client";

import type { ViewMode } from "@/lib/types";

export function ViewSkeleton({ kind }: { kind: ViewMode | "globe" | "map" }) {
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-surface">
      {(kind === "globe" || kind === "map") && (
        <div className="relative">
          <div className="h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-accent/20 to-sky-500/10 blur-2xl" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-44 w-44 rounded-full border border-line [animation:spin_8s_linear_infinite]">
              <div className="h-full w-full rounded-full border-t-2 border-primary" />
            </div>
          </div>
        </div>
      )}
      {kind === "list" && (
        <div className="w-full max-w-5xl space-y-3 p-8">
          <div className="skeleton h-9 w-48 rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-xl" />
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-10 flex flex-col items-center gap-2">
        <div className="text-sm font-medium text-ink-muted">Powering up your cockpit…</div>
        <div className="text-xs text-ink-muted">Syncing book of business</div>
      </div>
    </div>
  );
}
