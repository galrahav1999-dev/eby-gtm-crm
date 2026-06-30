"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Logger key status. Before keys are connected, prompts to Settings. Once the
 * Claude key is detected, shows a one-time dismissible confirmation, then a small
 * persistent "Connected" signal with a Manage keys link.
 */
export function KeyStatus({ aiOn, sttOn }: { aiOn: boolean; sttOn: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (!aiOn) {
    return (
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
        Connect your Claude key to use the logger. Pasted text needs only Claude; audio uploads also need an OpenAI key.{" "}
        <Link href="/settings" className="font-medium underline">
          Open Settings
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      {!dismissed && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: "color-mix(in srgb, var(--growth) 14%, transparent)", color: "var(--growth)" }}
        >
          <span>Your Claude key is connected. You are ready to log a conversation.</span>
          <button type="button" onClick={() => setDismissed(true)} className="shrink-0 text-xs underline opacity-80 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span
          className="chip"
          style={{ background: "color-mix(in srgb, var(--growth) 16%, transparent)", color: "var(--growth)" }}
        >
          Connected: Claude
        </span>
        {sttOn ? (
          <span className="chip" style={{ background: "color-mix(in srgb, var(--primary) 13%, transparent)", color: "var(--primary)" }}>
            OpenAI for audio
          </span>
        ) : (
          <span>To transcribe audio, add an OpenAI key. Text works with Claude alone.</span>
        )}
        <Link href="/settings" className="font-medium text-primary hover:underline">
          Manage keys
        </Link>
      </div>
    </div>
  );
}
