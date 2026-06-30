import { createClient } from "@/lib/supabase/server";
import { REGISTRY } from "@/lib/schema/registry";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface SearchHit {
  object: string;
  objectLabel: string;
  id: string;
  displayId: string | null;
  title: string;
  href: string;
}

// Strip characters that would break PostgREST's or()/ilike filter grammar.
function clean(q: string): string {
  return q.replace(/[,()*%]/g, " ").trim().slice(0, 80);
}

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = new URL(req.url).searchParams.get("q") ?? "";
  const q = clean(raw);
  if (q.length < 2) return NextResponse.json({ hits: [] });

  // Query every framework object across its own search fields, in parallel.
  const results = await Promise.all(
    Object.values(REGISTRY).map(async (def) => {
      const or = def.searchFields.map((f) => `${f}.ilike.%${q}%`).join(",");
      const { data } = await supabase
        .from(def.table)
        .select("*")
        .is("archived_at", null)
        .or(or)
        .limit(5);
      return (data ?? []).map(
        (r): SearchHit => ({
          object: def.key,
          objectLabel: def.singular,
          id: r.id,
          displayId: r.display_id ?? null,
          title: def.title(r),
          href: `/${def.key}/${r.id}`,
        })
      );
    })
  );

  const hits = results.flat().slice(0, 24);
  return NextResponse.json({ hits });
}
