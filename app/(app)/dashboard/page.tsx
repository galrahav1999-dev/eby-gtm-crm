import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, OwnerAvatar } from "@/components/crm/ui";
import { ownerColor } from "@/lib/colors";

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  const supabase = createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true }).is("archived_at", null);
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [people, orgs, interviews, deals, pilots, partners, overduePeople, overdueDeals, peopleOwners] =
    await Promise.all([
      count("people"),
      count("organizations"),
      count("interactions", (q) => q.eq("type", "Discovery interview")),
      count("deals"),
      count("pilots"),
      count("partners"),
      count("people", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
      count("deals", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
      supabase.from("people").select("owner").is("archived_at", null),
    ]);

  const overdue = overduePeople + overdueDeals;
  const byOwner = new Map<string, number>();
  for (const r of peopleOwners.data ?? []) {
    if (r.owner) byOwner.set(r.owner, (byOwner.get(r.owner) ?? 0) + 1);
  }
  const owners = [...byOwner.entries()].sort((a, b) => b[1] - a[1]);

  const stats = [
    { label: "Discovery interviews", value: interviews, sub: `of 25 sprint goal`, href: "/interactions", accent: true },
    { label: "People", value: people, sub: "contacts", href: "/people" },
    { label: "Organizations", value: orgs, sub: "schools & orgs", href: "/organizations" },
    { label: "Active deals", value: deals, sub: "opportunities", href: "/deals" },
    { label: "Pilots", value: pilots, sub: "design partners", href: "/pilots" },
    { label: "Partners", value: partners, sub: "channel", href: "/partners" },
    { label: "Overdue follow-ups", value: overdue, sub: "past due", href: "/people", warn: overdue > 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your go-to-market at a glance. Numbers update as the team logs work." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            {s.accent && (
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary-soft blur-xl" />
            )}
            <div className="label-eyebrow">{s.label}</div>
            <div className={`mt-2 text-4xl font-semibold tracking-tight ${s.warn ? "text-danger" : "text-ink"}`}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-ink-muted">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="label-eyebrow mb-2">Sprint goal</div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm text-ink-soft">Discovery interviews logged</span>
            <span className="text-sm font-medium text-ink">{interviews} / 25</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${Math.min(100, (interviews / 25) * 100)}%` }}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="label-eyebrow mb-3">People by owner</div>
          {owners.length > 0 ? (
            <ul className="space-y-2">
              {owners.map(([owner, n]) => (
                <li key={owner} className="flex items-center gap-2.5">
                  <OwnerAvatar owner={owner} size={22} />
                  <span className="flex-1 text-sm text-ink-soft">{owner}</span>
                  <span className="text-sm font-medium text-ink">{n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No owners assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
