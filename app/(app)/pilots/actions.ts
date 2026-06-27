"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit, computeDiff } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    org_id: str(fd.get("org_id")),
    champion_id: str(fd.get("champion_id")),
    stage: str(fd.get("stage")),
    urgency: str(fd.get("urgency")),
    capability: str(fd.get("capability")),
    representativeness: str(fd.get("representativeness")),
    success_metric: str(fd.get("success_metric")),
    feedback_cadence: str(fd.get("feedback_cadence")),
    dpa_signed: str(fd.get("dpa_signed")),
    convert_by: str(fd.get("convert_by")),
    owner: str(fd.get("owner")),
    next_step: str(fd.get("next_step")),
    notes: str(fd.get("notes")),
  };
}

export async function createPilot(fd: FormData) {
  const values = readForm(fd);
  const supabase = createClient();
  const { data, error } = await supabase.from("pilots").insert(values).select("id, display_id").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "create", table: "pilots", recordId: data.id, displayId: data.display_id, summary: `Created pilot ${data.display_id}` });
  revalidatePath("/pilots");
  redirect(`/pilots/${data.id}`);
}

export async function updatePilot(id: string, fd: FormData) {
  const values = readForm(fd);
  const supabase = createClient();
  const { data: before } = await supabase.from("pilots").select("*").eq("id", id).single();
  const { data, error } = await supabase.from("pilots").update(values).eq("id", id).select("id, display_id").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "update", table: "pilots", recordId: id, displayId: data.display_id, summary: `Edited pilot ${data.display_id}`, diff: before ? computeDiff(before, { ...before, ...values }) : null });
  revalidatePath("/pilots");
  revalidatePath(`/pilots/${id}`);
  redirect(`/pilots/${id}`);
}

export async function deletePilot(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase.from("pilots").select("display_id").eq("id", id).single();
  const { error } = await supabase.from("pilots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "delete", table: "pilots", recordId: id, displayId: before?.display_id ?? null, summary: `Deleted pilot ${before?.display_id ?? id}` });
  revalidatePath("/pilots");
  redirect("/pilots");
}
