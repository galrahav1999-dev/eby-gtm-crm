"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="logo-tile h-10 w-10 text-lg">א</div>
          <div>
            <div className="text-base font-semibold tracking-[0.14em] text-ink">EBY</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-muted">Team sign-in</div>
          </div>
        </div>

        {!configured && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Not connected to Supabase yet. Add the keys from docs/SETUP.md.
          </p>
        )}

        {sent ? (
          <p className="text-sm text-ink-soft">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@eby.team"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
            {mode === "password" && (
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            )}
            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy || !configured} className="btn-primary w-full">
              {busy ? "…" : mode === "password" ? "Sign in" : "Send magic link"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "password" ? "magic" : "password")}
              className="w-full text-center text-xs text-ink-muted hover:text-ink-soft"
            >
              {mode === "password" ? "Use a magic link instead" : "Use a password instead"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
