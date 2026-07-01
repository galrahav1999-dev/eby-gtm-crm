import { createClient } from "@/lib/supabase/server";
import { getObjectDef } from "@/lib/schema/registry";
import { getFormBundle } from "@/lib/record-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Options + FK picker data for an object, so the client quick-add drawer can
// render the same widgets the full form uses.
export async function GET(_req: Request, { params }: { params: { object: string } }) {
  const def = getObjectDef(params.object);
  if (!def) return NextResponse.json({ error: "Unknown object" }, { status: 404 });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { options, fk } = await getFormBundle(def);
  return NextResponse.json({
    options,
    fk,
    quickCreate: def.quickCreate ?? [],
    singular: def.singular,
    label: def.label,
  });
}
