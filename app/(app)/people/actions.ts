"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit, computeDiff } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readForm(fd: FormData) {
  return {
    first_name: str(fd.get("first_name")),
    last_name: str(fd.get("last_name")),
    email: str(fd.get("email")),
    role_title: str(fd.get("role_title")),
    org_id: str(fd.get("org_id")),
    country: str(fd.get("country")),
    city: str(fd.get("city")),
    segment: str(fd.get("segment")),
    source: str(fd.get("source")),
    lifecycle: str(fd.get("lifecycle")),
    owner: str(fd.get("owner")),
    next_step: str(fd.get("next_step")),
    next_step_date: str(fd.get("next_step_date")),
    notes: str(fd.get("notes")),
  };
}

function label(v: ReturnType<typeof readForm>) {
  return [v.first_name, v.last_name].filter(Boolean).join(" ") || v.email || "(no name)";
}

export async function createPerson(fd: FormData) {
  const values = readForm(fd);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("people")
    .insert(values)
    .select("id, display_id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "create",
    table: "people",
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created person ${label(values)}`,
  });

  revalidatePath("/people");
  redirect(`/people/${data.id}`);
}

export async function updatePerson(id: string, fd: FormData) {
  const values = readForm(fd);
  const supabase = createClient();

  const { data: before } = await supabase.from("people").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("people")
    .update(values)
    .eq("id", id)
    .select("id, display_id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "update",
    table: "people",
    recordId: id,
    displayId: data.display_id,
    summary: `Edited person ${label(values)}`,
    diff: before ? computeDiff(before, { ...before, ...values }) : null,
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export async function deletePerson(id: string) {
  const supabase = createClient();
  const { data: before } = await supabase
    .from("people")
    .select("display_id, first_name, last_name")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "delete",
    table: "people",
    recordId: id,
    displayId: before?.display_id ?? null,
    summary: `Deleted person ${[before?.first_name, before?.last_name].filter(Boolean).join(" ") || id}`,
  });

  revalidatePath("/people");
  redirect("/people");
}
