import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { personName, fmtDate } from "@/lib/format";
import { deletePilot } from "../actions";

export const dynamic = "force-dynamic";

export default async function PilotDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("pilots")
    .select("*, organizations(id,name), people(id,first_name,last_name)")
    .eq("id", params.id)
    .single<any>();
  if (!p) notFound();

  return (
    <div>
      <PageHeader back title={p.organizations?.name ? `Pilot · ${p.organizations.name}` : "Pilot"}>
        <Link href={`/pilots/${p.id}/edit`} className="btn-ghost">Edit</Link>
        <DeleteButton action={deletePilot.bind(null, p.id)} confirmText="Delete this pilot?" />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={p.display_id} />
        <Badge value={p.stage} />
        <Badge value={p.urgency} />
        <Badge value={p.owner} kind="owner" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DetailField label="Organization">
            {p.organizations ? <Link href={`/organizations/${p.organizations.id}`} className="text-accent-soft hover:underline">{p.organizations.name}</Link> : null}
          </DetailField>
          <DetailField label="Champion">
            {p.people ? <Link href={`/people/${p.people.id}`} className="text-accent-soft hover:underline">{personName(p.people)}</Link> : null}
          </DetailField>
          <DetailField label="Capability">{p.capability}</DetailField>
          <DetailField label="Representativeness">{p.representativeness}</DetailField>
        </div>
        <div>
          <DetailField label="Success metric">{p.success_metric}</DetailField>
          <DetailField label="Feedback cadence">{p.feedback_cadence && <Badge value={p.feedback_cadence} />}</DetailField>
          <DetailField label="DPA signed?">{p.dpa_signed && <Badge value={p.dpa_signed} />}</DetailField>
          <DetailField label="Convert-by date">{fmtDate(p.convert_by)}</DetailField>
        </div>
      </div>
      <DetailField label="Next step">{p.next_step}</DetailField>
      <DetailField label="Notes">{p.notes}</DetailField>
    </div>
  );
}
