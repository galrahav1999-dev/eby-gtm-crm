import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getObjectDef } from "@/lib/schema/registry";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// Inline quick-create of any framework object (used by FK pickers).
export async function POST(req: Request, { params }: { params: { object: string } }) {
  const def = getObjectDef(params.object);
  if (!def) return NextResponse.json({ error: "Unknown object" }, { status: 404 });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit("api_create", 60, 60);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const allowed = new Set(def.fields.map((f) => f.name));
  const values: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.has(k)) continue;
    const s = v == null ? null : String(v).trim();
    values[k] = s === "" ? null : s;
  }

  // Enforce required quickCreate-ish fields (e.g. name).
  const req0 = def.fields.find((f) => f.required);
  if (req0 && !values[req0.name]) {
    return NextResponse.json({ error: `${req0.label} is required` }, { status: 400 });
  }

  const { data, error } = await supabase.from(def.table).insert(values).select("id, display_id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(supabase, {
    action: "create",
    table: def.table,
    recordId: data.id,
    displayId: data.display_id,
    summary: `Created ${def.singular.toLowerCase()} ${def.title(values)} (inline)`,
  });

  return NextResponse.json({ id: data.id, label: def.title(values) });
}
