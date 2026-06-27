"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { str, num } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    cohort_label: str(fd.get("cohort_label")),
    segment: str(fd.get("segment")),
    signups: num(fd.get("signups")) ?? 0,
    confirmed: num(fd.get("confirmed")) ?? 0,
    activated: num(fd.get("activated")) ?? 0,
    retained_d30: num(fd.get("retained_d30")) ?? 0,
    paid: num(fd.get("paid")) ?? 0,
    notes: str(fd.get("notes")),
  };
}

export async function createCohort(fd: FormData) {
  const values = readForm(fd);
  if (!values.cohort_label) throw new Error("Cohort label is required.");
  const supabase = createClient();
  const { data, error } = await supabase.from("waitlist_cohorts").insert(values).select("id, display_id, cohort_label").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "create", table: "waitlist_cohorts", recordId: data.id, displayId: data.display_id, summary: `Added cohort ${data.cohort_label}` });
  revalidatePath("/waitlist");
  redirect("/waitlist");
}

export async function updateCohort(id: string, fd: FormData) {
  const values = readForm(fd);
  if (!values.cohort_label) throw new Error("Cohort label is required.");
  const supabase = createClient();
  const { data, error } = await supabase.from("waitlist_cohorts").update(values).eq("id", id).select("id, display_id, cohort_label").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "update", table: "waitlist_cohorts", recordId: id, displayId: data.display_id, summary: `Edited cohort ${data.cohort_label}` });
  revalidatePath("/waitlist");
  redirect("/waitlist");
}

export async function deleteCohort(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase.from("waitlist_cohorts").select("display_id, cohort_label").eq("id", id).single();
  const { error } = await supabase.from("waitlist_cohorts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "delete", table: "waitlist_cohorts", recordId: id, displayId: before?.display_id ?? null, summary: `Deleted cohort ${before?.cohort_label ?? id}` });
  revalidatePath("/waitlist");
  redirect("/waitlist");
}
