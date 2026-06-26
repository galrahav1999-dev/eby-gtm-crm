"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit, computeDiff } from "@/lib/audit";
import { str, num } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    name: str(fd.get("name")),
    org_id: str(fd.get("org_id")),
    economic_buyer_id: str(fd.get("economic_buyer_id")),
    poc_id: str(fd.get("poc_id")),
    champion_id: str(fd.get("champion_id")),
    stage: str(fd.get("stage")),
    priority: str(fd.get("priority")),
    has_hebrew: str(fd.get("has_hebrew")),
    current_solution: str(fd.get("current_solution")),
    current_state: str(fd.get("current_state")),
    pains: str(fd.get("pains")),
    ideal_state: str(fd.get("ideal_state")),
    eval_timing: str(fd.get("eval_timing")),
    decision_timeline: str(fd.get("decision_timeline")),
    seats: num(fd.get("seats")),
    acv: num(fd.get("acv")),
    opportunity_start: str(fd.get("opportunity_start")),
    expected_close: str(fd.get("expected_close")),
    owner: str(fd.get("owner")),
    next_step: str(fd.get("next_step")),
    next_step_date: str(fd.get("next_step_date")),
    closed_won_reason: str(fd.get("closed_won_reason")),
    closed_lost_reason: str(fd.get("closed_lost_reason")),
    notes: str(fd.get("notes")),
  };
}

export async function createDeal(fd: FormData) {
  const values = readForm(fd);
  if (!values.name) throw new Error("Deal name is required.");
  const supabase = createClient();
  const { data, error } = await supabase.from("deals").insert(values).select("id, display_id, name").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "create",
    table: "deals",
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created deal ${data.name}`,
  });
  revalidatePath("/deals");
  redirect(`/deals/${data.id}`);
}

export async function updateDeal(id: string, fd: FormData) {
  const values = readForm(fd);
  if (!values.name) throw new Error("Deal name is required.");
  const supabase = createClient();
  const { data: before } = await supabase.from("deals").select("*").eq("id", id).single();
  const { data, error } = await supabase.from("deals").update(values).eq("id", id).select("id, display_id, name").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "update",
    table: "deals",
    recordId: id,
    displayId: data.display_id,
    summary: `Edited deal ${data.name}`,
    diff: before ? computeDiff(before, { ...before, ...values }) : null,
  });
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  redirect(`/deals/${id}`);
}

export async function deleteDeal(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase.from("deals").select("display_id, name").eq("id", id).single();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "delete",
    table: "deals",
    recordId: id,
    displayId: before?.display_id ?? null,
    summary: `Deleted deal ${before?.name ?? id}`,
  });
  revalidatePath("/deals");
  redirect("/deals");
}
