import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { personName, fmtDate } from "@/lib/format";
import { deleteOrganization } from "../actions";
import type { Organization, Person, Interaction } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function OrganizationDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", params.id)
    .single<Organization>();
  if (!org) notFound();

  const [{ data: people }, { data: interactions }] = await Promise.all([
    supabase
      .from("people")
      .select("id, display_id, first_name, last_name, role_title, owner")
      .eq("org_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("interactions")
      .select("id, display_id, date, type, outcome")
      .eq("org_id", params.id)
      .order("date", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader back title={org.name} subtitle={undefined}>
        <Link href={`/organizations/${org.id}/edit`} className="btn-ghost">
          Edit
        </Link>
        <DeleteButton action={deleteOrganization.bind(null, org.id)} confirmText="Delete this organization?" />
      </PageHeader>

      <div className="mb-4 flex items-center gap-3">
        <IdTag id={org.display_id} />
        <Badge value={org.segment} />
        <Badge value={org.owner} kind="owner" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DetailField label="Org type">{org.org_type && <Badge value={org.org_type} />}</DetailField>
          <DetailField label="Age / grade band">{org.age_band}</DetailField>
          <DetailField label="Denomination">{org.denomination}</DetailField>
          <DetailField label="Affiliation / network">{org.affiliation}</DetailField>
        </div>
        <div>
          <DetailField label="City">{org.city}</DetailField>
          <DetailField label="Country">{org.country}</DetailField>
          <DetailField label="Size (students / seats)">{org.size}</DetailField>
          <DetailField label="Status">{org.status && <Badge value={org.status} />}</DetailField>
        </div>
      </div>
      <DetailField label="Domain">{org.domain}</DetailField>
      <DetailField label="Notes">{org.notes}</DetailField>

      {/* Linked people */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">People at this organization</h2>
        {people && people.length > 0 ? (
          <div className="card divide-y divide-white/5">
            {(people as Person[]).map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="flex items-center justify-between px-4 py-2.5 transition hover:bg-white/[0.03]"
              >
                <span className="text-sm text-slate-200">{personName(p)}</span>
                <span className="flex items-center gap-3">
                  {p.role_title && <Badge value={p.role_title} />}
                  <IdTag id={p.display_id} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No people linked yet.</p>
        )}
      </section>

      {/* Linked interactions */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">Interactions</h2>
        {interactions && interactions.length > 0 ? (
          <div className="card divide-y divide-white/5">
            {(interactions as Interaction[]).map((it) => (
              <div key={it.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <Badge value={it.type} />
                  <span className="text-xs text-slate-500">{fmtDate(it.date)}</span>
                </div>
                {it.outcome && <p className="mt-1 text-sm text-slate-300">{it.outcome}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No interactions logged yet.</p>
        )}
      </section>
    </div>
  );
}
