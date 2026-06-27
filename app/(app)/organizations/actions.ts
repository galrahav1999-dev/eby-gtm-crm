"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit, computeDiff } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    name: str(fd.get("name")),
    domain: str(fd.get("domain")),
    org_type: str(fd.get("org_type")),
    age_band: str(fd.get("age_band")),
    denomination: str(fd.get("denomination")),
    city: str(fd.get("city")),
    country: str(fd.get("country")),
    size: str(fd.get("size")),
    affiliation: str(fd.get("affiliation")),
    segment: str(fd.get("segment")),
    owner: str(fd.get("owner")),
    status: str(fd.get("status")),
    notes: str(fd.get("notes")),
  };
}

export async function createOrganization(fd: FormData) {
  const values = readForm(fd);
  if (!values.name) throw new Error("Organization name is required.");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert(values)
    .select("id, display_id, name")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "create",
    table: "organizations",
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created organization ${data.name}`,
  });

  revalidatePath("/organizations");
  redirect(`/organizations/${data.id}`);
}

export async function updateOrganization(id: string, fd: FormData) {
  const values = readForm(fd);
  if (!values.name) throw new Error("Organization name is required.");
  const supabase = createClient();

  const { data: before } = await supabase.from("organizations").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("organizations")
    .update(values)
    .eq("id", id)
    .select("id, display_id, name")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "update",
    table: "organizations",
    recordId: id,
    displayId: data.display_id,
    summary: `Edited organization ${data.name}`,
    diff: before ? computeDiff(before, { ...before, ...values }) : null,
  });

  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  redirect(`/organizations/${id}`);
}

export async function deleteOrganization(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase
    .from("organizations")
    .select("display_id, name")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "delete",
    table: "organizations",
    recordId: id,
    displayId: before?.display_id ?? null,
    summary: `Deleted organization ${before?.name ?? id}`,
  });

  revalidatePath("/organizations");
  redirect("/organizations");
}
