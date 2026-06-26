import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type Action = "create" | "update" | "delete";

interface AuditInput {
  action: Action;
  table: string;
  recordId?: string | null;
  displayId?: string | null;
  summary: string;
  /** Field-level before/after, only the changed fields. */
  diff?: Record<string, { from: unknown; to: unknown }> | null;
}

/**
 * Append one row to the audit log. Best-effort: a logging failure must never
 * block the user's actual write, so errors are swallowed (and surfaced to the
 * server console for troubleshooting).
 */
export async function logAudit(supabase: SupabaseClient, input: AuditInput) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      actor_email: user?.email ?? null,
      actor_name: (user?.user_metadata?.name as string) ?? null,
      action: input.action,
      table_name: input.table,
      record_id: input.recordId ?? null,
      display_id: input.displayId ?? null,
      summary: input.summary,
      diff: input.diff ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to write audit row:", e);
  }
}

/** Compute a minimal field-level diff between two record snapshots. */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (k === "updated_at") continue;
    const a = before[k] ?? null;
    const b = after[k] ?? null;
    if (a !== b) diff[k] = { from: a, to: b };
  }
  return diff;
}
