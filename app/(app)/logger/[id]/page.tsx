import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge } from "@/components/crm/ui";
import { SubmitButton } from "@/components/crm/form";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { commitIngestion, discardIngestion } from "../actions";
import type { Proposal } from "@/lib/ai/extract";

export const dynamic = "force-dynamic";

const FRIENDLY: Record<string, string> = {
  organizations: "Organizations",
  people: "People",
  deals: "Deals",
  interactions: "Interactions",
};

function RecordCard({
  prefix,
  index,
  record,
}: {
  prefix: string;
  index: number;
  record: Record<string, unknown>;
}) {
  const fields = Object.entries(record).filter(([, v]) => v != null && String(v).trim() !== "");
  return (
    <label className="flex cursor-pointer gap-3 border-b border-white/5 px-4 py-3 last:border-0">
      <input type="checkbox" name={`${prefix}_${index}`} defaultChecked className="mt-1 accent-indigo-500" />
      <div className="min-w-0 flex-1">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {fields.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <dt className="shrink-0 text-slate-500">{k.replace(/_/g, " ")}:</dt>
              <dd className="min-w-0 text-slate-200">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </label>
  );
}

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: ing } = await supabase
    .from("ai_ingestions")
    .select("*")
    .eq("id", params.id)
    .single<any>();
  if (!ing) notFound();

  if (ing.status === "error") {
    return (
      <div>
        <PageHeader title="AI logger" subtitle="Something went wrong on this run." />
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{ing.error}</div>
        <Link href="/logger" className="btn-ghost mt-4">Back to logger</Link>
      </div>
    );
  }

  if (ing.status === "committed") {
    const r = ing.result ?? {};
    const counts = [
      ["organizations", r.organizations?.length ?? 0],
      ["people", r.people?.length ?? 0],
      ["deals", r.deals?.length ?? 0],
      ["interactions", r.interactions?.length ?? 0],
    ] as const;
    return (
      <div>
        <PageHeader title="Saved" subtitle="These records were created from this run." />
        <div className="card p-5">
          <div className="flex flex-wrap gap-4">
            {counts.map(([k, n]) => (
              <div key={k} className="text-center">
                <div className="text-2xl font-semibold text-white">{n as number}</div>
                <div className="text-xs text-slate-500">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/people" className="btn-ghost">View people</Link>
          <Link href="/logger" className="btn-primary">Log another</Link>
        </div>
      </div>
    );
  }

  const proposal = (ing.proposal ?? { organizations: [], people: [], deals: [], interactions: [], to_chase_next: [] }) as Proposal;
  const sections: { key: keyof typeof FRIENDLY; prefix: string; items: any[] }[] = [
    { key: "organizations", prefix: "org", items: proposal.organizations },
    { key: "people", prefix: "person", items: proposal.people },
    { key: "deals", prefix: "deal", items: proposal.deals },
    { key: "interactions", prefix: "interaction", items: proposal.interactions },
  ];
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <PageHeader title="Review draft records" subtitle="Untick anything you don't want. Nothing is saved until you click Save.">
        <DeleteButton action={discardIngestion.bind(null, ing.id)} label="Discard" confirmText="Discard this run?" />
      </PageHeader>

      {total === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-400">
          The AI did not find any records to create from this text.
        </div>
      ) : (
        <form action={commitIngestion.bind(null, ing.id)} className="space-y-5">
          {sections.map((s) =>
            s.items.length > 0 ? (
              <div key={s.key}>
                <h2 className="mb-2 text-sm font-semibold text-white">
                  {FRIENDLY[s.key]} <span className="text-slate-500">({s.items.length})</span>
                </h2>
                <div className="card overflow-hidden">
                  {s.items.map((rec, i) => (
                    <RecordCard key={i} prefix={s.prefix} index={i} record={rec} />
                  ))}
                </div>
              </div>
            ) : null
          )}

          {proposal.to_chase_next?.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">To chase next</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {proposal.to_chase_next.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <SubmitButton label="Save selected records" />
            <Link href="/logger" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      )}

      {ing.transcript && (
        <details className="mt-8">
          <summary className="cursor-pointer text-xs text-slate-500">Show source text</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/5 bg-ink-900/60 p-4 text-xs text-slate-400">{ing.transcript}</pre>
        </details>
      )}
    </div>
  );
}
