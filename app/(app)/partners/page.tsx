import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "display_id", header: "ID", kind: "id" },
  { key: "partner_org", header: "Partner", kind: "strong" },
  { key: "partner_type", header: "Type", kind: "badge" },
  { key: "stage", header: "Stage", kind: "badge" },
  { key: "expected_reach", header: "Reach" },
  { key: "owner", header: "Owner", kind: "owner" },
  { key: "next_step_date", header: "Next step", kind: "nextdate" },
];

export default async function PartnersPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("partners")
    .select("id, display_id, partner_org, partner_type, stage, expected_reach, owner, next_step_date")
    .order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader title="Partners" subtitle="Channel and referral partners: Ulpans, Birthright, federations.">
        <Link href="/partners/new" className="btn-primary">+ New partner</Link>
      </PageHeader>
      {rows && rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/partners" searchPlaceholder="Search partners…" />
      ) : (
        <EmptyState message="No partners yet." cta={<Link href="/partners/new" className="btn-primary">+ Add the first one</Link>} />
      )}
    </div>
  );
}
