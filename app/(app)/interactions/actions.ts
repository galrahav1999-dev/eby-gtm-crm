"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInteraction(fd: FormData) {
  const values = {
    date: str(fd.get("date")),
    person_id: str(fd.get("person_id")),
    org_id: str(fd.get("org_id")),
    deal_id: str(fd.get("deal_id")),
    type: str(fd.get("type")),
    owner: str(fd.get("owner")),
    outcome: str(fd.get("outcome")),
    verbatim_quote: str(fd.get("verbatim_quote")),
    next_step: str(fd.get("next_step")),
    next_step_date: str(fd.get("next_step_date")),
  };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert(values)
    .select("id, display_id, type")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    action: "create",
    table: "interactions",
    recordId: data.id,
    displayId: data.display_id,
    summary: `Logged interaction (${data.type ?? "touch"})`,
  });

  revalidatePath("/interactions");
  revalidatePath("/");
  redirect(`/interactions/${data.id}`);
}
