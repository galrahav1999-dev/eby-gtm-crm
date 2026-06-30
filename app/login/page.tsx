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

  const [googleBusy, setGoogleBusy] = useState(false);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function signInWithGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setGoogleBusy(false);
    }
  }

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
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleBusy || !configured}
              className="btn-ghost mb-3 w-full justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3 0-5.6-2-6.6-4.8H1.4v3C3.4 21.3 7.4 24 12 24Z" />
                <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6v-3H1.4a12 12 0 0 0 0 10.6l4-3Z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.8l4 3C6.4 6.8 9 4.8 12 4.8Z" />
              </svg>
              {googleBusy ? "Redirecting…" : "Continue with Google"}
            </button>
            <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-wider text-ink-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
