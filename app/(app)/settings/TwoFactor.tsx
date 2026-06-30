"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/crm/ConfirmModal";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const codeField =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-center text-lg tracking-[0.4em] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary";

export function TwoFactor() {
  const supabase = createClient();
  const router = useRouter();
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []).filter((f: any) => f.status === "verified"));
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `EBY-${Date.now()}` });
      if (error) throw error;
      setEnroll({ id: data.id, qr: (data as any).totp.qr_code, secret: (data as any).totp.secret });
    } catch (e) {
      setErr(msg(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!enroll) return;
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
      if (error) throw error;
      setEnroll(null);
      setCode("");
      await load();
      router.refresh();
    } catch (e) {
      setErr(msg(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      await load();
      router.refresh();
    } catch (e) {
      setErr(msg(e));
    } finally {
      setBusy(false);
      setConfirmRemove(null);
    }
  }

  const on = factors.length > 0;

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Two-factor authentication</h2>
        <span
          className="chip"
          style={{
            background: on ? "color-mix(in srgb, var(--growth) 16%, transparent)" : "color-mix(in srgb, var(--ink-muted) 14%, transparent)",
            color: on ? "var(--growth)" : "var(--ink-muted)",
          }}
        >
          {loading ? "…" : on ? "On" : "Off"}
        </span>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        Use an authenticator app (Google Authenticator, 1Password, Authy). Required to manage API keys and to delete your account.
      </p>

      {err && (
        <p className="mb-3 rounded-lg px-3 py-2 text-xs text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {err}
        </p>
      )}

      {!loading && on && !enroll && (
        <button type="button" onClick={() => setConfirmRemove(factors[0].id)} disabled={busy} className="btn-ghost">
          Turn off 2FA
        </button>
      )}

      {!loading && !on && !enroll && (
        <button type="button" onClick={startEnroll} disabled={busy} className="btn-primary">
          {busy ? "Starting…" : "Set up two-factor"}
        </button>
      )}

      {enroll && (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">Scan this in your authenticator app, or enter the key manually, then type the 6-digit code.</p>
          <div className="flex flex-wrap items-center gap-4">
            {enroll.qr.trim().startsWith("<svg") ? (
              <div className="h-40 w-40 rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: enroll.qr }} />
            ) : (
              <img src={enroll.qr} alt="2FA QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
            )}
            <div className="text-xs text-ink-muted">
              Manual key:
              <div className="mt-1 break-all rounded-lg border border-line bg-surface-muted px-2 py-1 font-mono text-ink">{enroll.secret}</div>
            </div>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className={codeField}
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={verify} disabled={busy || code.length < 6} className="btn-primary">
              {busy ? "Verifying…" : "Verify and turn on"}
            </button>
            <button type="button" onClick={() => { setEnroll(null); setCode(""); }} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmRemove != null}
        title="Turn off two-factor?"
        message="You will no longer be asked for a code. You can turn it back on anytime."
        confirmLabel="Turn off"
        danger
        busy={busy}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => confirmRemove && remove(confirmRemove)}
      />
    </div>
  );
}
