import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { personName, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InteractionDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: it } = await supabase
    .from("interactions")
    .select(
      "*, people(id,first_name,last_name), organizations(id,name), deals(id,name)"
    )
    .eq("id", params.id)
    .single<any>();
  if (!it) notFound();

  return (
    <div>
      <PageHeader back title={`${it.type ?? "Interaction"}`} subtitle={fmtDate(it.date)} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={it.display_id} />
        <Badge value={it.type} />
        <Badge value={it.owner} kind="owner" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-3">
        <DetailField label="Person">
          {it.people ? <Link href={`/people/${it.people.id}`} className="text-accent-soft hover:underline">{personName(it.people)}</Link> : null}
        </DetailField>
        <DetailField label="Organization">
          {it.organizations ? <Link href={`/organizations/${it.organizations.id}`} className="text-accent-soft hover:underline">{it.organizations.name}</Link> : null}
        </DetailField>
        <DetailField label="Deal">
          {it.deals ? <Link href={`/deals/${it.deals.id}`} className="text-accent-soft hover:underline">{it.deals.name}</Link> : null}
        </DetailField>
      </div>

      <DetailField label="What happened / outcome">{it.outcome}</DetailField>
      <DetailField label="Verbatim quote / key signal">
        {it.verbatim_quote && <span className="italic text-slate-300">“{it.verbatim_quote}”</span>}
      </DetailField>
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <DetailField label="Next step">{it.next_step}</DetailField>
        <DetailField label="Next-step date">{fmtDate(it.next_step_date)}</DetailField>
      </div>

      <p className="mt-6 text-xs text-slate-600">
        Interactions are append-only. To correct something, log a new interaction.
      </p>
    </div>
  );
}
