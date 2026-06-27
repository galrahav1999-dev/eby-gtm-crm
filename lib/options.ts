import "server-only";
import { createClient } from "./supabase/server";
import { FALLBACK_OPTIONS } from "./enums";

export type OptionsMap = Record<string, string[]>;

/**
 * Load all active dropdown options from the database, grouped by field_key.
 * Falls back to the in-code lists if the database cannot be reached, so forms
 * never render empty selects.
 */
export async function getAllOptions(): Promise<OptionsMap> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("field_options")
      .select("field_key, value, sort_order, active")
      .eq("active", true)
      .order("field_key", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallback();
    const map: OptionsMap = {};
    for (const row of data) {
      (map[row.field_key] ??= []).push(row.value);
    }
    // Ensure every known field has at least its fallback list.
    for (const key of Object.keys(FALLBACK_OPTIONS)) {
      if (!map[key]) map[key] = [...FALLBACK_OPTIONS[key]];
    }
    return map;
  } catch {
    return fallback();
  }
}

function fallback(): OptionsMap {
  const map: OptionsMap = {};
  for (const [k, v] of Object.entries(FALLBACK_OPTIONS)) map[k] = [...v];
  return map;
}
