import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { WorldMap, type MapPoint } from "@/components/crm/WorldMap";
import { resolveCoords, jitter } from "@/lib/geo";
import { personName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = createClient();
  const [{ data: orgs }, { data: people }] = await Promise.all([
    supabase.from("organizations").select("id, display_id, name, city, country, segment"),
    supabase.from("people").select("id, display_id, first_name, last_name, city, country, segment"),
  ]);

  const points: MapPoint[] = [];

  for (const o of orgs ?? []) {
    const c = resolveCoords(o.country, o.city);
    if (!c) continue;
    const j = jitter(o.id);
    points.push({
      lat: c.lat + j.dLat,
      lng: c.lng + j.dLng,
      label: `${o.name}${o.city ? " · " + o.city : ""}`,
      color: "#22d3ee",
      href: `/organizations/${o.id}`,
      kind: "org",
    });
  }
  for (const p of people ?? []) {
    const c = resolveCoords(p.country, p.city);
    if (!c) continue;
    const j = jitter(p.id);
    points.push({
      lat: c.lat + j.dLat,
      lng: c.lng + j.dLng,
      label: `${personName(p)}${p.city ? " · " + p.city : ""}`,
      color: "#f472b6",
      href: `/people/${p.id}`,
      kind: "person",
    });
  }

  const placed = points.length;
  const total = (orgs?.length ?? 0) + (people?.length ?? 0);

  return (
    <div>
      <PageHeader
        title="World map"
        subtitle={`The GTM universe. ${placed} of ${total} records placed by location. Click a point to open it.`}
      />
      {placed > 0 ? (
        <WorldMap points={points} />
      ) : (
        <EmptyState message="No records have a recognizable location yet. Add a city or country to see them on the globe." />
      )}
    </div>
  );
}
