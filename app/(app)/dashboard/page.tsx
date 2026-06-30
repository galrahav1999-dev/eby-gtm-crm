import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/crm/ui";
import { DashboardView, type DashboardData } from "@/components/crm/DashboardView";

export const dynamic = "force-dynamic";

async function rows(table: string, columns: string): Promise<any[]> {
  const supabase = createClient();
  const { data } = await supabase.from(table).select(columns).is("archived_at", null);
  return data ?? [];
}

export default async function DashboardPage() {
  const [deals, people, orgs, interactions, pilots, partners, cohorts] = await Promise.all([
    rows("deals", "stage, owner, acv, next_step_date"),
    rows("people", "owner, next_step_date"),
    rows("organizations", "owner"),
    rows("interactions", "owner, type"),
    rows("pilots", "owner"),
    rows("partners", "owner"),
    rows("waitlist_cohorts", "cohort_label, signups, confirmed, activated, retained_d30, paid"),
  ]);

  const data: DashboardData = { deals, people, orgs, interactions, pilots, partners, cohorts };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your go-to-market at a glance. Pick an owner to scope the numbers to one person."
      />
      <DashboardView data={data} />
    </div>
  );
}
