import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { personName } from "@/lib/format";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "date", header: "Date", kind: "date" },
  { key: "type", header: "Type", kind: "badge" },
  { key: "person_name", header: "Person" },
  { key: "org_name", header: "Organization" },
  { key: "deal_name", header: "Deal" },
  { key: "owner", header: "Owner", kind: "owner" },
];

export default async function InteractionsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("interactions")
    .select(
      "id, display_id, date, type, owner, people(first_name,last_name), organizations(name), deals(name)"
    )
    .order("date", { ascending: false, nullsFirst: false });

  const rows = (data ?? []).map((it: any) => ({
    id: it.id,
    date: it.date,
    type: it.type,
    person_name: it.people ? personName(it.people) : "",
    org_name: it.organizations?.name ?? "",
    deal_name: it.deals?.name ?? "",
    owner: it.owner,
  }));

  return (
    <div>
      <PageHeader title="Interactions" subtitle="Every call and meeting, newest first. Append-only: a log you can trust.">
        <Link href="/interactions/new" className="btn-primary">+ Log interaction</Link>
      </PageHeader>
      {rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/interactions" searchPlaceholder="Search interactions…" />
      ) : (
        <EmptyState message="No interactions logged yet." cta={<Link href="/interactions/new" className="btn-primary">+ Log the first one</Link>} />
      )}
    </div>
  );
}
