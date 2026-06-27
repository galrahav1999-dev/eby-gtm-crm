import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

// Create an organization inline (used by the "Create new organization" picker).
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });

  const clean = (v: unknown) => {
    const s = (v ?? "").toString().trim();
    return s === "" ? null : s;
  };

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      org_type: clean(body.org_type),
      segment: clean(body.segment),
      city: clean(body.city),
      country: clean(body.country),
      owner: clean(body.owner),
      status: clean(body.status),
      notes: clean(body.notes),
    })
    .select("id, display_id, name")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(supabase, {
    action: "create",
    table: "organizations",
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created organization ${data.name} (inline)`,
  });
  return NextResponse.json({ id: data.id, name: data.name });
}
