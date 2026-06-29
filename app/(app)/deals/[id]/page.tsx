import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { personName, fmtDate } from "@/lib/format";
import { deleteDeal } from "../actions";
import type { Deal, Person } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function DealDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: deal } = await supabase.from("deals").select("*").eq("id", params.id).single<Deal>();
  if (!deal) notFound();

  const personIds = [deal.economic_buyer_id, deal.poc_id, deal.champion_id].filter(Boolean) as string[];
  const [{ data: org }, { data: peopleRows }, { data: interactions }] = await Promise.all([
    deal.org_id
      ? supabase.from("organizations").select("id, name").eq("id", deal.org_id).single()
      : Promise.resolve({ data: null }),
    personIds.length
      ? supabase.from("people").select("id, first_name, last_name").in("id", personIds)
      : Promise.resolve({ data: [] as Person[] }),
    supabase.from("interactions").select("id, date, type, outcome, verbatim_quote").eq("deal_id", params.id).order("date", { ascending: false }),
  ]);

  const nameOf = (id: string | null) => {
    if (!id) return null;
    const p = (peopleRows as Person[] | null)?.find((x) => x.id === id);
    return p ? <Link href={`/people/${p.id}`} className="text-primary hover:underline">{personName(p)}</Link> : null;
  };

  const money = deal.acv != null ? `$${Number(deal.acv).toLocaleString()}` : null;

  return (
    <div>
      <PageHeader back title={deal.name}>
        <Link href={`/deals/${deal.id}/edit`} className="btn-ghost">Edit</Link>
        <DeleteButton action={deleteDeal.bind(null, deal.id)} confirmText="Delete this deal?" />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={deal.display_id} />
        <Badge value={deal.stage} />
        <Badge value={deal.priority} />
        <Badge value={deal.owner} kind="owner" />
        {org && (
          <Link href={`/organizations/${org.id}`} className="text-sm text-primary hover:underline">
            {org.name}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DetailField label="Economic buyer">{nameOf(deal.economic_buyer_id)}</DetailField>
          <DetailField label="Point of contact">{nameOf(deal.poc_id)}</DetailField>
          <DetailField label="Champion">{nameOf(deal.champion_id)}</DetailField>
          <DetailField label="Has Hebrew program today?">{deal.has_hebrew && <Badge value={deal.has_hebrew} />}</DetailField>
          <DetailField label="Current solution">{deal.current_solution}</DetailField>
          <DetailField label="Current state">{deal.current_state}</DetailField>
        </div>
        <div>
          <DetailField label="Seats">{deal.seats}</DetailField>
          <DetailField label="ACV / expected value">{money}</DetailField>
          <DetailField label="Eval start timing">{deal.eval_timing && <Badge value={deal.eval_timing} />}</DetailField>
          <DetailField label="Decision timeline">{deal.decision_timeline && <Badge value={deal.decision_timeline} />}</DetailField>
          <DetailField label="Opportunity start">{fmtDate(deal.opportunity_start)}</DetailField>
          <DetailField label="Expected close">{fmtDate(deal.expected_close)}</DetailField>
        </div>
      </div>

      <DetailField label="Pains (their words)">
        {deal.pains && <span className="italic text-ink-soft">“{deal.pains}”</span>}
      </DetailField>
      <DetailField label="Ideal state">{deal.ideal_state}</DetailField>
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <DetailField label="Next step">{deal.next_step}</DetailField>
        <DetailField label="Next-step date">{fmtDate(deal.next_step_date)}</DetailField>
        <DetailField label="Closed-won reason">{deal.closed_won_reason && <Badge value={deal.closed_won_reason} />}</DetailField>
        <DetailField label="Closed-lost reason">{deal.closed_lost_reason && <Badge value={deal.closed_lost_reason} />}</DetailField>
      </div>
      <DetailField label="Notes">{deal.notes}</DetailField>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Interactions on this deal</h2>
        {interactions && interactions.length > 0 ? (
          <div className="card divide-y divide-line">
            {interactions.map((it: any) => (
              <div key={it.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <Badge value={it.type} />
                  <span className="text-xs text-ink-muted">{fmtDate(it.date)}</span>
                </div>
                {it.outcome && <p className="mt-1 text-sm text-ink-soft">{it.outcome}</p>}
                {it.verbatim_quote && (
                  <p className="mt-1 border-l-2 border-primary pl-3 text-sm italic text-ink-muted">“{it.verbatim_quote}”</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No interactions logged on this deal yet.</p>
        )}
      </section>
    </div>
  );
}
