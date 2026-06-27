import "server-only";
import { createClient } from "./supabase/server";
import { getObjectDef } from "./schema/registry";
import { getAllOptions } from "./options";
import type { ObjectDef, FieldDef } from "./schema/types";
import type { FkData } from "@/components/crm/RecordForm";

/** Active (non-archived) rows for an object. */
export async function loadActive(def: ObjectDef) {
  const supabase = createClient();
  const { data } = await supabase
    .from(def.table)
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  return (data ?? []) as Record<string, any>[];
}

/** Map of id -> display title for a set of ids in a target object. */
export async function fkLabelMap(targetKey: string, ids: string[]): Promise<Record<string, string>> {
  const def = getObjectDef(targetKey);
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!def || unique.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase.from(def.table).select("*").in("id", unique);
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.id] = def.title(r);
  return map;
}

/** Options + FK picker data needed to render a form for an object. */
export async function getFormBundle(def: ObjectDef): Promise<{ options: any; fk: Record<string, FkData> }> {
  const options = await getAllOptions();
  const fk: Record<string, FkData> = {};
  const supabase = createClient();
  for (const f of def.fields) {
    if (f.widget !== "fk" || !f.fkTo || fk[f.fkTo]) continue;
    const tdef = getObjectDef(f.fkTo);
    if (!tdef) continue;
    const { data } = await supabase.from(tdef.table).select("*").is("archived_at", null);
    const records = (data ?? [])
      .map((r) => ({ id: r.id, label: tdef.title(r) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const createFields = (tdef.quickCreate ?? [])
      .map((n) => tdef.fields.find((x) => x.name === n))
      .filter(Boolean) as FieldDef[];
    fk[f.fkTo] = { records, createFields, targetKey: tdef.key, targetSingular: tdef.singular };
  }
  return { options, fk };
}

/** Related records to show on a detail page. */
export async function getLinked(def: ObjectDef, id: string) {
  const supabase = createClient();
  const out: { label: string; objectKey: string; rows: { id: string; title: string }[] }[] = [];
  for (const link of def.linked ?? []) {
    const tdef = getObjectDef(link.object);
    const { data } = await supabase.from(link.fk ? (tdef?.table ?? link.object) : link.object).select("*").eq(link.fk, id).is("archived_at", null);
    const rows = (data ?? []).map((r) => ({ id: r.id, title: tdef ? tdef.title(r) : (r.display_id ?? r.id) }));
    out.push({ label: link.label, objectKey: link.object, rows });
  }
  return out;
}
