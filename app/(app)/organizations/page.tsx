import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "display_id", header: "ID", kind: "id" },
  { key: "name", header: "Name", kind: "strong" },
  { key: "org_type", header: "Type", kind: "badge" },
  { key: "segment", header: "Segment", kind: "badge" },
  { key: "city", header: "City" },
  { key: "country", header: "Country" },
  { key: "owner", header: "Owner", kind: "owner" },
  { key: "status", header: "Status", kind: "badge" },
];

export default async function OrganizationsPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("organizations")
    .select("id, display_id, name, org_type, segment, city, country, owner, status")
    .order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader title="Organizations" subtitle="Schools, synagogues, JCCs, Ulpans, and partners.">
        <Link href="/organizations/new" className="btn-primary">
          + New organization
        </Link>
      </PageHeader>

      {rows && rows.length > 0 ? (
        <DataTable rows={rows} columns={columns} basePath="/organizations" searchPlaceholder="Search organizations…" />
      ) : (
        <EmptyState
          message="No organizations yet."
          cta={
            <Link href="/organizations/new" className="btn-primary">
              + Add the first one
            </Link>
          }
        />
      )}
    </div>
  );
}
