"use server";

import { createClient } from "@/lib/supabase/server";
import { getObjectDef } from "@/lib/schema/registry";
import { getAllOptions } from "@/lib/options";
import { logAudit, computeDiff } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export interface StageResult {
  ok: boolean;
  error?: string;
}

/**
 * Move one record to a new stage from the board. This is a narrow update of the
 * single `stage` column (not the full form), so it never trips required-field
 * validation, and it writes an audit row just like a normal edit.
 */
export async function setStage(
  objectKey: string,
  id: string,
  stage: string
): Promise<StageResult> {
  const def = getObjectDef(objectKey);
  if (!def) return { ok: false, error: "Unknown object." };
  const field = def.fields.find((f) => f.name === "stage");
  if (!field) return { ok: false, error: "This object has no stage." };

  // The stage must be a known option (or a value already used, in case the
  // team added one). Reject anything else so a bad drop cannot corrupt data.
  const options = await getAllOptions();
  const allowed = field.optionsKey ? options[field.optionsKey] ?? [] : [];
  if (allowed.length && !allowed.includes(stage)) {
    return { ok: false, error: "Unknown stage." };
  }

  const supabase = createClient();
  const { data: before } = await supabase.from(def.table).select("*").eq("id", id).single();
  if (!before) return { ok: false, error: "Record not found." };
  if (before.stage === stage) return { ok: true };

  const { error } = await supabase.from(def.table).update({ stage }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    action: "update",
    table: def.table,
    recordId: id,
    displayId: before.display_id,
    summary: `Moved ${def.singular.toLowerCase()} ${def.title(before)} to ${stage}`,
    diff: computeDiff(before, { ...before, stage }),
  });

  revalidatePath(`/${objectKey}`);
  return { ok: true };
}
