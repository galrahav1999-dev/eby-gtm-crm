import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "display_id", header: "ID", kind: "id" },
  { key: "org_name", header: "Organization", kind: "strong" },
  { key: "stage", header: "Stage", kind: "badge" },
  { key: "urgency", header: "Urgency", kind: "badge" },
  { key: "dpa_signed", header: "DPA", kind: "badge" },
  { key: "owner", header: "Owner", kind: "owner" },
  { key: "convert_by", header: "Convert by", kind: "date" },
];

export default async function PilotsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("pilots")
    .select("id, display_id, stage, urgency, dpa_signed, owner, convert_by, organizations(name)")
    .order("created_at", { ascending: true });

  const rows = (data ?? []).map((p: any) => ({
    id: p.id,
    display_id: p.display_id,
    org_name: p.organizations?.name ?? "(no org)",
    stage: p.stage,
    urgency: p.urgency,
    dpa_signed: p.dpa_signed,
    owner: p.owner,
    convert_by: p.convert_by,
  }));

  return (
    <div>
      <PageHeader title="Pilots" subtitle="Design-partner pilots: urgency, capability, representativeness.">
        <Link href="/pilots/new" className="btn-primary">+ New pilot</Link>
      </PageHeader>
      {rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/pilots" searchPlaceholder="Search pilots…" />
      ) : (
        <EmptyState message="No pilots yet." cta={<Link href="/pilots/new" className="btn-primary">+ Add the first one</Link>} />
      )}
    </div>
  );
}
