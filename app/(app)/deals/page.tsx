import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "display_id", header: "ID", kind: "id" },
  { key: "name", header: "Deal", kind: "strong" },
  { key: "org_name", header: "Organization" },
  { key: "stage", header: "Stage", kind: "badge" },
  { key: "priority", header: "Priority", kind: "badge" },
  { key: "acv", header: "ACV" },
  { key: "owner", header: "Owner", kind: "owner" },
  { key: "next_step_date", header: "Next step", kind: "nextdate" },
];

export default async function DealsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("deals")
    .select("id, display_id, name, stage, priority, acv, owner, next_step_date, organizations(name)")
    .order("created_at", { ascending: true });

  const rows = (data ?? []).map((d: any) => ({
    id: d.id,
    display_id: d.display_id,
    name: d.name,
    org_name: d.organizations?.name ?? "",
    stage: d.stage,
    priority: d.priority,
    acv: d.acv != null ? `$${Number(d.acv).toLocaleString()}` : "",
    owner: d.owner,
    next_step_date: d.next_step_date,
  }));

  return (
    <div>
      <PageHeader title="Deals" subtitle="B2B opportunities at schools, synagogues, and community orgs.">
        <Link href="/deals/new" className="btn-primary">+ New deal</Link>
      </PageHeader>
      {rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/deals" searchPlaceholder="Search deals…" />
      ) : (
        <EmptyState message="No deals yet." cta={<Link href="/deals/new" className="btn-primary">+ Add the first one</Link>} />
      )}
    </div>
  );
}
