import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { personName } from "@/lib/format";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "display_id", header: "ID", kind: "id" },
  { key: "name", header: "Name", kind: "strong" },
  { key: "role_title", header: "Role", kind: "badge" },
  { key: "org_name", header: "Organization" },
  { key: "segment", header: "Segment", kind: "badge" },
  { key: "owner", header: "Owner", kind: "owner" },
  { key: "lifecycle", header: "Lifecycle", kind: "badge" },
  { key: "next_step_date", header: "Next step", kind: "nextdate" },
];

export default async function PeoplePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("people")
    .select(
      "id, display_id, first_name, last_name, role_title, segment, owner, lifecycle, next_step_date, organizations(name)"
    )
    .order("created_at", { ascending: true });

  const rows = (data ?? []).map((p: any) => ({
    id: p.id,
    display_id: p.display_id,
    name: personName(p),
    role_title: p.role_title,
    org_name: p.organizations?.name ?? "",
    segment: p.segment,
    owner: p.owner,
    lifecycle: p.lifecycle,
    next_step_date: p.next_step_date,
  }));

  return (
    <div>
      <PageHeader title="People" subtitle="Every contact: teachers, principals, parents, learners, partners.">
        <Link href="/people/new" className="btn-primary">
          + New person
        </Link>
      </PageHeader>

      {rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/people" searchPlaceholder="Search people…" />
      ) : (
        <EmptyState
          message="No people yet."
          cta={
            <Link href="/people/new" className="btn-primary">
              + Add the first one
            </Link>
          }
        />
      )}
    </div>
  );
}
