"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit, computeDiff } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    partner_org: str(fd.get("partner_org")),
    partner_type: str(fd.get("partner_type")),
    primary_contact_id: str(fd.get("primary_contact_id")),
    stage: str(fd.get("stage")),
    what_they_give: str(fd.get("what_they_give")),
    expected_reach: str(fd.get("expected_reach")),
    terms: str(fd.get("terms")),
    owner: str(fd.get("owner")),
    next_step: str(fd.get("next_step")),
    next_step_date: str(fd.get("next_step_date")),
    notes: str(fd.get("notes")),
  };
}

export async function createPartner(fd: FormData) {
  const values = readForm(fd);
  if (!values.partner_org) throw new Error("Partner organization is required.");
  const supabase = createClient();
  const { data, error } = await supabase.from("partners").insert(values).select("id, display_id, partner_org").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "create", table: "partners", recordId: data.id, displayId: data.display_id, summary: `Created partner ${data.partner_org}` });
  revalidatePath("/partners");
  redirect(`/partners/${data.id}`);
}

export async function updatePartner(id: string, fd: FormData) {
  const values = readForm(fd);
  if (!values.partner_org) throw new Error("Partner organization is required.");
  const supabase = createClient();
  const { data: before } = await supabase.from("partners").select("*").eq("id", id).single();
  const { data, error } = await supabase.from("partners").update(values).eq("id", id).select("id, display_id, partner_org").single();
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "update", table: "partners", recordId: id, displayId: data.display_id, summary: `Edited partner ${data.partner_org}`, diff: before ? computeDiff(before, { ...before, ...values }) : null });
  revalidatePath("/partners");
  revalidatePath(`/partners/${id}`);
  redirect(`/partners/${id}`);
}

export async function deletePartner(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase.from("partners").select("display_id, partner_org").eq("id", id).single();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "delete", table: "partners", recordId: id, displayId: before?.display_id ?? null, summary: `Deleted partner ${before?.partner_org ?? id}` });
  revalidatePath("/partners");
  redirect("/partners");
}
