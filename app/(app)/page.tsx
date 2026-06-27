import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  const supabase = createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const [people, orgs, interviews, deals, overduePeople, overdueDeals] = await Promise.all([
    count("people"),
    count("organizations"),
    count("interactions", (q) => q.eq("type", "Discovery interview")),
    count("deals"),
    count("people", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
    count("deals", (q) => q.lte("next_step_date", today).not("next_step_date", "is", null)),
  ]);

  const interviewGoal = 25;
  const overdue = overduePeople + overdueDeals;

  const stats = [
    { label: "Discovery interviews", value: interviews, sub: `of ${interviewGoal} sprint goal`, href: "/interactions" },
    { label: "People", value: people, sub: "contacts in the CRM", href: "/people" },
    { label: "Organizations", value: orgs, sub: "schools & orgs", href: "/organizations" },
    { label: "Active deals", value: deals, sub: "B2B opportunities", href: "/deals" },
    { label: "Overdue follow-ups", value: overdue, sub: "next step past due", href: "/people", warn: overdue > 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your go-to-market at a glance. The numbers update as the team logs work."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group p-4 transition hover:ring-1 hover:ring-accent/30"
          >
            <div className="label-eyebrow">{s.label}</div>
            <div className={`mt-2 text-3xl font-semibold ${s.warn ? "text-rose-300" : "text-white"}`}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="label-eyebrow mb-2">Sprint goal</div>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm text-slate-300">Discovery interviews logged</span>
          <span className="text-sm font-medium text-white">
            {interviews} / {interviewGoal}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, (interviews / interviewGoal) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
