import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

// Add a new value to an editable dropdown list (field_options).
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { field_key, value } = await req.json();
  if (!field_key || !value) return NextResponse.json({ error: "Missing field_key or value" }, { status: 400 });

  const { data: max } = await supabase
    .from("field_options")
    .select("sort_order")
    .eq("field_key", field_key)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("field_options").insert({
    field_key,
    value,
    sort_order: (max?.sort_order ?? -1) + 1,
    active: true,
  });
  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await logAudit(supabase, { action: "create", table: "field_options", summary: `Added option "${value}" to ${field_key}` });
  return NextResponse.json({ ok: true, value });
}
