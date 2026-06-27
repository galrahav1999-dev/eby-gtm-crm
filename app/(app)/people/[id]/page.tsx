import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { personName, fmtDate, isOverdue } from "@/lib/format";
import { deletePerson } from "../actions";
import type { Person, Interaction } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function PersonDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: person } = await supabase
    .from("people")
    .select("*, organizations(id, name)")
    .eq("id", params.id)
    .single<Person & { organizations: { id: string; name: string } | null }>();
  if (!person) notFound();

  const { data: interactions } = await supabase
    .from("interactions")
    .select("id, display_id, date, type, outcome, verbatim_quote")
    .eq("person_id", params.id)
    .order("date", { ascending: false });

  return (
    <div>
      <PageHeader title={personName(person)}>
        <Link href={`/people/${person.id}/edit`} className="btn-ghost">
          Edit
        </Link>
        <DeleteButton action={deletePerson.bind(null, person.id)} confirmText="Delete this person?" />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={person.display_id} />
        {person.role_title && <Badge value={person.role_title} />}
        <Badge value={person.segment} />
        <Badge value={person.owner} kind="owner" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DetailField label="Email">{person.email}</DetailField>
          <DetailField label="Organization">
            {person.organizations ? (
              <Link href={`/organizations/${person.organizations.id}`} className="text-accent-soft hover:underline">
                {person.organizations.name}
              </Link>
            ) : null}
          </DetailField>
          <DetailField label="Lifecycle">{person.lifecycle && <Badge value={person.lifecycle} />}</DetailField>
          <DetailField label="Source">{person.source}</DetailField>
        </div>
        <div>
          <DetailField label="City">{person.city}</DetailField>
          <DetailField label="Country">{person.country}</DetailField>
          <DetailField label="Next step">{person.next_step}</DetailField>
          <DetailField label="Next-step date">
            {person.next_step_date && (
              <span className={isOverdue(person.next_step_date) ? "font-medium text-rose-300" : ""}>
                {fmtDate(person.next_step_date)}
                {isOverdue(person.next_step_date) && " (due)"}
              </span>
            )}
          </DetailField>
        </div>
      </div>
      <DetailField label="Notes">{person.notes}</DetailField>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">Interactions</h2>
        {interactions && interactions.length > 0 ? (
          <div className="card divide-y divide-white/5">
            {(interactions as Interaction[]).map((it) => (
              <div key={it.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <Badge value={it.type} />
                  <span className="text-xs text-slate-500">{fmtDate(it.date)}</span>
                </div>
                {it.outcome && <p className="mt-1 text-sm text-slate-300">{it.outcome}</p>}
                {it.verbatim_quote && (
                  <p className="mt-1 border-l-2 border-accent/40 pl-3 text-sm italic text-slate-400">
                    “{it.verbatim_quote}”
                  </p>
                )}
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
