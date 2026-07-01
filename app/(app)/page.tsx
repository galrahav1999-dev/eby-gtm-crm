import { createClient } from "@/lib/supabase/server";
import { resolveCoords, jitter } from "@/lib/geo";
import { personName } from "@/lib/format";
import { B2B_STAGES } from "@/lib/enums";
import { GlobeHome, type GlobePoint } from "@/components/crm/GlobeHome";

// The five progression stages, for the compact globe funnel (outcomes omitted).
const FLOW = B2B_STAGES.filter((s) => !/closed/i.test(s));

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  const supabase = createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true }).is("archived_at", null);
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function Home() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: orgs }, { data: people }, interviews, deals, { data: dealStages }, overduePeople, overdueDeals] =
    await Promise.all([
      supabase.from("organizations").select("id, display_id, name, owner, segment, country, city, org_type").is("archived_at", null),
      supabase.from("people").select("id, display_id, first_name, last_name, owner, segment, country, city").is("archived_at", null),
      count("interactions", (q) => q.eq("type", "Discovery interview")),
      count("deals"),
      supabase.from("deals").select("stage").is("archived_at", null),
      count("people", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
      count("deals", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
    ]);

  const funnel = FLOW.map((stage) => ({
    stage,
    count: (dealStages ?? []).filter((d) => d.stage === stage).length,
  }));

  const points: GlobePoint[] = [];
  for (const o of orgs ?? []) {
    const c = resolveCoords(o.country, o.city);
    if (!c) continue;
    const j = jitter(o.id);
    points.push({
      id: o.id, kind: "org", name: o.name, label: `${o.name}${o.city ? " · " + o.city : ""}`,
      owner: o.owner ?? null, segment: o.segment ?? null, country: o.country ?? null, city: o.city ?? null,
      lat: c.lat + j.dLat, lng: c.lng + j.dLng, href: `/organizations/${o.id}`,
    });
  }
  for (const p of people ?? []) {
    const c = resolveCoords(p.country, p.city);
    if (!c) continue;
    const j = jitter(p.id);
    points.push({
      id: p.id, kind: "person", name: personName(p), label: `${personName(p)}${p.city ? " · " + p.city : ""}`,
      owner: p.owner ?? null, segment: p.segment ?? null, country: p.country ?? null, city: p.city ?? null,
      lat: c.lat + j.dLat, lng: c.lng + j.dLng, href: `/people/${p.id}`,
    });
  }

  const stats = {
    interviews,
    people: people?.length ?? 0,
    orgs: orgs?.length ?? 0,
    deals,
    overdue: overduePeople + overdueDeals,
    placed: points.length,
    total: (orgs?.length ?? 0) + (people?.length ?? 0),
    funnel,
  };

  return <GlobeHome points={points} stats={stats} />;
}
