"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setKey, removeKey } from "./actions";

export function KeyCard({
  provider,
  label,
  blurb,
  getUrl,
  connected,
  disabled,
}: {
  provider: "openai" | "anthropic";
  label: string;
  blurb: string;
  getUrl: string;
  connected: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await setKey(provider, val);
      setVal("");
      setOk("Connected. Your key is encrypted and will not be shown again.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the key.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await removeKey(provider);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove the key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{label}</h2>
        <span
          className="chip"
          style={{
            background: connected
              ? "color-mix(in srgb, var(--growth) 16%, transparent)"
              : "color-mix(in srgb, var(--ink-muted) 14%, transparent)",
            color: connected ? "var(--growth)" : "var(--ink-muted)",
          }}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        {blurb}{" "}
        <a href={getUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Get a key
        </a>
        .
      </p>

      <input
        type="password"
        value={val}
        disabled={disabled || busy}
        placeholder={connected ? "Paste a new key to replace" : "Paste your key"}
        onChange={(e) => {
          setVal(e.target.value);
          setErr(null);
          setOk(null);
        }}
        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-60"
      />

      {err && (
        <p className="mt-2 rounded-lg px-3 py-2 text-xs text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {err}
        </p>
      )}
      {ok && (
        <p className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "color-mix(in srgb, var(--growth) 14%, transparent)", color: "var(--growth)" }}>
          {ok}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={save} disabled={disabled || busy || !val.trim()} className="btn-primary">
          {busy ? "Saving…" : connected ? "Replace key" : "Connect key"}
        </button>
        {connected && (
          <button type="button" onClick={remove} disabled={busy} className="btn-ghost">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
