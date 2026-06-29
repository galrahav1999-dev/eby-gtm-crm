import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { PageHeader, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { discardIngestion } from "../actions";
import { ReviewProposal } from "../ReviewProposal";
import type { Proposal } from "@/lib/ai/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function CommittedView({ result }: { result: any }) {
  const supabase = createClient();
  const ids = {
    organizations: (result?.organizations ?? []) as string[],
    people: (result?.people ?? []) as string[],
    deals: (result?.deals ?? []) as string[],
    interactions: (result?.interactions ?? []) as string[],
  };

  const [orgs, ppl, dls, ints] = await Promise.all([
    ids.organizations.length ? supabase.from("organizations").select("id, display_id, name").in("id", ids.organizations) : Promise.resolve({ data: [] as any[] }),
    ids.people.length ? supabase.from("people").select("id, display_id, first_name, last_name").in("id", ids.people) : Promise.resolve({ data: [] as any[] }),
    ids.deals.length ? supabase.from("deals").select("id, display_id, name").in("id", ids.deals) : Promise.resolve({ data: [] as any[] }),
    ids.interactions.length ? supabase.from("interactions").select("id, display_id").in("id", ids.interactions) : Promise.resolve({ data: [] as any[] }),
  ]);

  const orgRows = orgs.data ?? [];
  const personRows = ppl.data ?? [];
  const dealRows = dls.data ?? [];
  const intRows = ints.data ?? [];
  const totalCreated = orgRows.length + personRows.length + dealRows.length + intRows.length;

  if (totalCreated === 0) {
    return (
      <div>
        <PageHeader back title="Nothing was saved" subtitle="No records were created from this run." />
        <div className="mt-4 flex gap-3">
          <Link href="/logger" className="btn-primary">Capture another</Link>
          <Link href="/" className="btn-ghost">Back to the globe</Link>
        </div>
      </div>
    );
  }

  const created: { label: string; href: string; id: string }[] = [
    ...orgRows.map((r: any) => ({ label: r.name ?? "Organization", href: `/organizations/${r.id}`, id: r.display_id })),
    ...personRows.map((r: any) => ({ label: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Person", href: `/people/${r.id}`, id: r.display_id })),
    ...dealRows.map((r: any) => ({ label: r.name ?? "Deal", href: `/deals/${r.id}`, id: r.display_id })),
    ...intRows.map((r: any) => ({ label: "Interaction", href: `/interactions/${r.id}`, id: r.display_id })),
  ];

  return (
    <div>
      <PageHeader
        back
        title="Saved"
        subtitle={`Created ${orgRows.length} organization(s), ${personRows.length} person(s), ${dealRows.length} deal(s), ${intRows.length} interaction(s). Here is what you can do next.`}
      />

      <div className="card divide-y divide-line">
        {created.map((c) => (
          <Link key={c.href} href={c.href} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-muted">
            <span className="text-sm font-medium text-ink">{c.label}</span>
            <IdTag id={c.id} />
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink">Next steps</h2>
      <div className="flex flex-wrap gap-3">
        {personRows.map((r: any) => (
          <Link key={r.id} href={`/people/${r.id}`} className="btn-ghost">
            Open {[r.first_name, r.last_name].filter(Boolean).join(" ") || "person"}
          </Link>
        ))}
        {orgRows.map((r: any) => (
          <Link key={r.id} href={`/organizations/${r.id}`} className="btn-ghost">
            Open {r.name ?? "organization"}
          </Link>
        ))}
        {orgRows.map((r: any) => (
          <Link key={`deal-${r.id}`} href={`/deals/new?org_id=${r.id}`} className="btn-ghost">
            Start a deal for {r.name ?? "this org"}
          </Link>
        ))}
        {orgRows.map((r: any) => (
          <Link key={`pilot-${r.id}`} href={`/pilots/new?org_id=${r.id}`} className="btn-ghost">
            Start a pilot for {r.name ?? "this org"}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">Back to the globe</Link>
        <Link href="/logger" className="btn-ghost">Log another</Link>
      </div>
    </div>
  );
}

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: ing } = await supabase.from("ai_ingestions").select("*").eq("id", params.id).single<any>();
  if (!ing) notFound();

  if (ing.status === "error") {
    return (
      <div>
        <PageHeader back title="AI logger" subtitle="Something went wrong on this run." />
        <div className="rounded-lg px-4 py-3 text-sm text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {ing.error}
        </div>
        <Link href="/logger" className="btn-ghost mt-4">Back to logger</Link>
      </div>
    );
  }

  if (ing.status === "committed") {
    return <CommittedView result={ing.result ?? {}} />;
  }

  const proposal = (ing.proposal ?? { organizations: [], people: [], deals: [], interactions: [], to_chase_next: [] }) as Proposal;
  const total =
    proposal.organizations.length + proposal.people.length + proposal.deals.length + proposal.interactions.length;

  if (total === 0) {
    return (
      <div>
        <PageHeader back title="Review draft records" subtitle="The AI did not find any records to create from this conversation.">
          <DeleteButton action={discardIngestion.bind(null, ing.id)} label="Discard" confirmText="Discard this run?" />
        </PageHeader>
        <div className="card px-6 py-12 text-center text-sm text-ink-muted">Nothing to review.</div>
        <Link href="/logger" className="btn-primary mt-4">Capture another</Link>
      </div>
    );
  }

  const options = await getAllOptions();

  return (
    <div>
      <PageHeader back title="Review and edit" subtitle="Check exactly where each value will go, edit anything, then accept.">
        <DeleteButton action={discardIngestion.bind(null, ing.id)} label="Discard" confirmText="Discard this run?" />
      </PageHeader>

      <ReviewProposal id={ing.id} proposal={proposal} options={options} />

      {proposal.to_chase_next?.length > 0 && (
        <div className="card mt-5 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">To chase next</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {proposal.to_chase_next.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {ing.transcript && (
        <details className="mt-8">
          <summary className="cursor-pointer text-xs text-ink-muted">Show source text</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-line-soft bg-surface p-4 text-xs text-ink-muted">{ing.transcript}</pre>
        </details>
      )}
    </div>
  );
}
