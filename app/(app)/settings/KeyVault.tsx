"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/crm/ConfirmModal";
import { addKey, activateKey, removeKey } from "./vault-actions";

type Provider = "openai" | "anthropic";
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const field =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary";

const PROVIDERS: { key: Provider; label: string; blurb: string; getUrl: string }[] = [
  { key: "anthropic", label: "Claude (Anthropic)", blurb: "Extraction. Required for the logger.", getUrl: "https://console.anthropic.com/settings/keys" },
  { key: "openai", label: "OpenAI (Whisper)", blurb: "Audio transcription only.", getUrl: "https://platform.openai.com/api-keys" },
];

export function KeyVault({ encOn }: { encOn: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [needCode, setNeedCode] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<Provider, { label: string; value: string }>>({
    anthropic: { label: "", value: "" },
    openai: { label: "", value: "" },
  });
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  async function checkAal() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.nextLevel === "aal2" && data?.currentLevel !== "aal2") {
      setNeedCode(true);
      const { data: f } = await supabase.auth.mfa.listFactors();
      setFactorId(f?.totp?.[0]?.id ?? null);
    } else {
      setNeedCode(false);
    }
  }
  async function loadKeys() {
    const { data } = await supabase
      .from("user_api_keys")
      .select("id, provider, label, is_active, created_at")
      .order("created_at", { ascending: true });
    setKeys(data ?? []);
  }
  async function refresh() {
    setLoading(true);
    await checkAal();
    await loadKeys();
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function elevate() {
    if (!factorId) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) throw error;
      setCode("");
      await refresh();
      router.refresh();
    } catch (e) {
      setErr(msg(e));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await loadKeys();
      router.refresh();
    } catch (e) {
      setErr(msg(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="card p-5 text-sm text-ink-muted">Loading keys…</div>;

  if (needCode) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-ink">Verify it's you</h2>
        <p className="mb-3 text-xs text-ink-muted">Two-factor is on. Enter your 6-digit code to manage API keys.</p>
        {err && (
          <p className="mb-3 rounded-lg px-3 py-2 text-xs text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
            {err}
          </p>
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          className="w-full max-w-[200px] rounded-lg border border-line bg-card px-3 py-2 text-center text-lg tracking-[0.4em] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary"
        />
        <div className="mt-3">
          <button type="button" onClick={elevate} disabled={busy || code.length < 6} className="btn-primary">
            {busy ? "Verifying…" : "Verify"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {err && (
        <p className="rounded-lg px-3 py-2 text-sm text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {err}
        </p>
      )}
      {PROVIDERS.map((p) => {
        const mine = keys.filter((k) => k.provider === p.key);
        return (
          <div key={p.key} className="card p-5">
            <h2 className="text-sm font-semibold text-ink">{p.label}</h2>
            <p className="mb-3 text-xs text-ink-muted">
              {p.blurb}{" "}
              <a href={p.getUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Get a key
              </a>
              .
            </p>

            {mine.length > 0 && (
              <ul className="mb-3 space-y-2">
                {mine.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-ink">
                      {k.label || "Key"}{" "}
                      {k.is_active && (
                        <span className="chip ml-1" style={{ background: "color-mix(in srgb, var(--growth) 16%, transparent)", color: "var(--growth)" }}>
                          Active
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {!k.is_active && (
                        <button type="button" disabled={busy} onClick={() => run(() => activateKey(k.id, p.key))} className="text-xs font-medium text-primary hover:underline">
                          Make active
                        </button>
                      )}
                      <button type="button" disabled={busy} onClick={() => setConfirmRemove(k.id)} className="text-xs text-ink-muted hover:text-danger">
                        Remove
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <input
                placeholder="Label (e.g. Personal)"
                value={draft[p.key].label}
                disabled={!encOn || busy}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: { ...d[p.key], label: e.target.value } }))}
                className={`${field} max-w-[160px]`}
              />
              <input
                type="password"
                placeholder="Paste a key"
                value={draft[p.key].value}
                disabled={!encOn || busy}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: { ...d[p.key], value: e.target.value } }))}
                className={`${field} max-w-[220px]`}
              />
              <button
                type="button"
                disabled={!encOn || busy || !draft[p.key].value.trim()}
                onClick={() =>
                  run(async () => {
                    await addKey(p.key, draft[p.key].label, draft[p.key].value);
                    setDraft((d) => ({ ...d, [p.key]: { label: "", value: "" } }));
                  })
                }
                className="btn-primary"
              >
                Add key
              </button>
            </div>
          </div>
        );
      })}

      <ConfirmModal
        open={confirmRemove != null}
        title="Remove this key?"
        message="The logger will stop using it. If it was active, set another active."
        confirmLabel="Remove key"
        danger
        busy={busy}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          const id = confirmRemove!;
          setConfirmRemove(null);
          run(() => removeKey(id));
        }}
      />
    </div>
  );
}
