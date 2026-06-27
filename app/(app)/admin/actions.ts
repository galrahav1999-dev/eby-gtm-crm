"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { str } from "@/lib/format";
import { revalidatePath } from "next/cache";

export async function addOption(fieldKey: string, fd: FormData) {
  const value = str(fd.get("value"));
  if (!value) return;
  const supabase = createClient();

  const { data: max } = await supabase
    .from("field_options")
    .select("sort_order")
    .eq("field_key", fieldKey)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("field_options").insert({
    field_key: fieldKey,
    value,
    sort_order: (max?.sort_order ?? -1) + 1,
    active: true,
  });
  // Unique violation = value already exists; ignore silently.
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);

  await logAudit(supabase, {
    action: "create",
    table: "field_options",
    summary: `Added option "${value}" to ${fieldKey}`,
  });
  revalidatePath("/admin");
}

export async function toggleOption(id: string, active: boolean) {
  const supabase = createClient();
  const { data } = await supabase
    .from("field_options")
    .update({ active })
    .eq("id", id)
    .select("field_key, value")
    .single();
  await logAudit(supabase, {
    action: "update",
    table: "field_options",
    summary: `${active ? "Showed" : "Hid"} option "${data?.value}" in ${data?.field_key}`,
  });
  revalidatePath("/admin");
}

export async function deleteOption(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("field_options")
    .select("field_key, value")
    .eq("id", id)
    .single();
  await supabase.from("field_options").delete().eq("id", id);
  await logAudit(supabase, {
    action: "delete",
    table: "field_options",
    summary: `Deleted option "${data?.value}" from ${data?.field_key}`,
  });
  revalidatePath("/admin");
}
