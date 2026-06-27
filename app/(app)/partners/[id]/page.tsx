import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { personName, fmtDate } from "@/lib/format";
import { deletePartner } from "../actions";

export const dynamic = "force-dynamic";

export default async function PartnerDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("partners")
    .select("*, people(id,first_name,last_name)")
    .eq("id", params.id)
    .single<any>();
  if (!p) notFound();

  return (
    <div>
      <PageHeader back title={p.partner_org}>
        <Link href={`/partners/${p.id}/edit`} className="btn-ghost">Edit</Link>
        <DeleteButton action={deletePartner.bind(null, p.id)} confirmText="Delete this partner?" />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={p.display_id} />
        <Badge value={p.partner_type} />
        <Badge value={p.stage} />
        <Badge value={p.owner} kind="owner" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DetailField label="Primary contact">
            {p.people ? <Link href={`/people/${p.people.id}`} className="text-accent-soft hover:underline">{personName(p.people)}</Link> : null}
          </DetailField>
          <DetailField label="What they give us">{p.what_they_give}</DetailField>
          <DetailField label="Expected reach">{p.expected_reach}</DetailField>
        </div>
        <div>
          <DetailField label="Commission / terms">{p.terms}</DetailField>
          <DetailField label="Next step">{p.next_step}</DetailField>
          <DetailField label="Next-step date">{fmtDate(p.next_step_date)}</DetailField>
        </div>
      </div>
      <DetailField label="Notes">{p.notes}</DetailField>
    </div>
  );
}
