import "server-only";
import { createClient } from "./supabase/server";
import { personName } from "./format";

/** Organizations as {id,label} for FK pickers. */
export async function getOrgOptions() {
  const supabase = createClient();
  const { data } = await supabase.from("organizations").select("id, name").order("name");
  return (data ?? []).map((o) => ({ id: o.id, label: o.name }));
}

/** People as {id,label} for FK pickers (name + email when present). */
export async function getPeopleOptions() {
  const supabase = createClient();
  const { data } = await supabase
    .from("people")
    .select("id, first_name, last_name, email")
    .order("first_name");
  return (data ?? []).map((p) => ({
    id: p.id,
    label: personName(p) + (p.email ? ` (${p.email})` : ""),
  }));
}

/** Deals as {id,label} for FK pickers. */
export async function getDealOptions() {
  const supabase = createClient();
  const { data } = await supabase.from("deals").select("id, name").order("name");
  return (data ?? []).map((d) => ({ id: d.id, label: d.name }));
}
