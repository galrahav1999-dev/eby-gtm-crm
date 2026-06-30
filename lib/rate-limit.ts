import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Standard fixed-window, per-user rate limiting backed by the rate_events table.
 * Returns { ok } and a friendly message. Durable across serverless instances.
 * Call before expensive or abusable actions (AI runs, inline create).
 */
export async function checkRateLimit(
  action: string,
  max: number,
  windowSeconds: number
): Promise<{ ok: boolean; message?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You are not signed in." };

  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await supabase
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("action", action)
    .gte("created_at", since);

  if ((count ?? 0) >= max) {
    return { ok: false, message: "You are going a bit fast. Please wait a minute and try again." };
  }
  await supabase.from("rate_events").insert({ user_id: user.id, action });
  return { ok: true };
}

/** Throwing variant for server actions whose callers surface errors inline. */
export async function enforceRateLimit(action: string, max: number, windowSeconds: number): Promise<void> {
  const { ok, message } = await checkRateLimit(action, max, windowSeconds);
  if (!ok) throw new Error(message ?? "Rate limit reached.");
}
