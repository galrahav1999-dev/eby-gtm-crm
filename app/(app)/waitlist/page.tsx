import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, Badge } from "@/components/crm/ui";
import type { WaitlistCohort } from "@/lib/db-types";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

export default async function WaitlistPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("waitlist_cohorts")
    .select("*")
    .order("cohort_label", { ascending: true });
  const cohorts = (data ?? []) as WaitlistCohort[];

  const totals = cohorts.reduce(
    (t, c) => ({
      signups: t.signups + (c.signups || 0),
      confirmed: t.confirmed + (c.confirmed || 0),
      activated: t.activated + (c.activated || 0),
      retained_d30: t.retained_d30 + (c.retained_d30 || 0),
      paid: t.paid + (c.paid || 0),
    }),
    { signups: 0, confirmed: 0, activated: 0, retained_d30: 0, paid: 0 }
  );

  return (
    <div>
      <PageHeader title="B2C waitlist" subtitle="Consumer funnel by cohort: signups → confirmed → activated → retained → paid.">
        <Link href="/waitlist/new" className="btn-primary">+ Add cohort</Link>
      </PageHeader>

      {cohorts.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-2.5">Cohort</th>
                <th className="px-4 py-2.5">Segment</th>
                <th className="px-4 py-2.5 text-right">Signups</th>
                <th className="px-4 py-2.5 text-right">Confirmed</th>
                <th className="px-4 py-2.5 text-right">Activated</th>
                <th className="px-4 py-2.5 text-right">D30</th>
                <th className="px-4 py-2.5 text-right">Paid</th>
                <th className="px-4 py-2.5 text-right">Conf %</th>
                <th className="px-4 py-2.5 text-right">Sign→Paid %</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.id} className="border-b border-line-soft">
                  <td className="px-4 py-3">
                    <Link href={`/waitlist/${c.id}/edit`} className="font-medium text-ink hover:text-primary">
                      {c.cohort_label}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge value={c.segment} /></td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.signups}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.confirmed}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.activated}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.retained_d30}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.paid}</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{pct(c.confirmed, c.signups)}</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{pct(c.paid, c.signups)}</td>
                </tr>
              ))}
              <tr className="bg-surface-muted font-medium text-ink">
                <td className="px-4 py-3" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right">{totals.signups}</td>
                <td className="px-4 py-3 text-right">{totals.confirmed}</td>
                <td className="px-4 py-3 text-right">{totals.activated}</td>
                <td className="px-4 py-3 text-right">{totals.retained_d30}</td>
                <td className="px-4 py-3 text-right">{totals.paid}</td>
                <td className="px-4 py-3 text-right">{pct(totals.confirmed, totals.signups)}</td>
                <td className="px-4 py-3 text-right">{pct(totals.paid, totals.signups)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No cohorts yet." cta={<Link href="/waitlist/new" className="btn-primary">+ Add the first cohort</Link>} />
      )}
    </div>
  );
}
