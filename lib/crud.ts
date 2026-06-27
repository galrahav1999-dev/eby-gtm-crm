import "server-only";
import { createClient } from "./supabase/server";
import { logAudit, computeDiff } from "./audit";
import { str, num } from "./format";
import type { ObjectDef } from "./schema/types";

/** Coerce submitted form data into a column->value object, per the registry. */
export function coerceForm(def: ObjectDef, fd: FormData): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of def.fields) {
    const raw = fd.get(f.name);
    out[f.name] = f.widget === "number" || f.widget === "money" ? num(raw) : str(raw);
  }
  return out;
}

/** Validate required fields; returns an error message or null. */
export function validate(def: ObjectDef, values: Record<string, any>): string | null {
  for (const f of def.fields) {
    if (f.required && (values[f.name] == null || values[f.name] === "")) {
      return `${f.label} is required.`;
    }
  }
  return null;
}

export async function createRecord(def: ObjectDef, fd: FormData) {
  const values = coerceForm(def, fd);
  const err = validate(def, values);
  if (err) throw new Error(err);
  const supabase = createClient();
  const { data, error } = await supabase.from(def.table).insert(values).select("id, display_id").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "create",
    table: def.table,
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created ${def.singular.toLowerCase()} ${def.title(values)}`,
  });
  return data as { id: string; display_id: string };
}

export async function updateRecord(def: ObjectDef, id: string, fd: FormData) {
  const values = coerceForm(def, fd);
  const err = validate(def, values);
  if (err) throw new Error(err);
  const supabase = createClient();
  const { data: before } = await supabase.from(def.table).select("*").eq("id", id).single();
  const { data, error } = await supabase.from(def.table).update(values).eq("id", id).select("id, display_id").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "update",
    table: def.table,
    recordId: id,
    displayId: data.display_id,
    summary: `Edited ${def.singular.toLowerCase()} ${def.title({ ...before, ...values })}`,
    diff: before ? computeDiff(before, { ...before, ...values }) : null,
  });
  return data as { id: string; display_id: string };
}

/** Soft delete: archive the record (recoverable), do not hard-delete. */
export async function archiveRecord(def: ObjectDef, id: string) {
  const supabase = createClient();
  const { data: before } = await supabase.from(def.table).select("*").eq("id", id).single();
  const { error } = await supabase
    .from(def.table)
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "delete",
    table: def.table,
    recordId: id,
    displayId: before?.display_id ?? null,
    summary: `Archived ${def.singular.toLowerCase()} ${before ? def.title(before) : id}`,
  });
}

export async function restoreRecord(def: ObjectDef, id: string) {
  const supabase = createClient();
  await supabase.from(def.table).update({ archived_at: null }).eq("id", id);
}
