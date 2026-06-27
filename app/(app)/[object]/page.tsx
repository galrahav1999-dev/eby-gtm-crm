import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjectDef } from "@/lib/schema/registry";
import { fieldByName } from "@/lib/schema/types";
import { loadActive, fkLabelMap } from "@/lib/record-data";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";

export const dynamic = "force-dynamic";

export default async function ListPage({ params }: { params: { object: string } }) {
  const def = getObjectDef(params.object);
  if (!def) notFound();

  const rows = await loadActive(def);

  // Resolve labels for any FK columns shown in the list.
  const fkMaps: Record<string, Record<string, string>> = {};
  for (const colName of def.listColumns) {
    const f = fieldByName(def, colName);
    if (f?.widget === "fk" && f.fkTo) {
      fkMaps[colName] = await fkLabelMap(f.fkTo, rows.map((r) => r[colName]));
    }
  }

  const columns: Column[] = [
    { key: "display_id", header: "ID", kind: "id" },
    { key: "__title", header: def.singular, kind: "strong" },
    ...def.listColumns.map((colName): Column => {
      const f = fieldByName(def, colName);
      let kind: Column["kind"] = "text";
      if (f?.widget === "date") kind = colName === "next_step_date" ? "nextdate" : "date";
      else if (f?.widget === "combobox" || f?.widget === "select")
        kind = f.optionsKey === "owner" ? "owner" : "badge";
      return { key: colName, header: f?.label ?? colName, kind };
    }),
  ];

  const dataRows = rows.map((r) => {
    const out: Record<string, unknown> = { id: r.id, display_id: r.display_id, __title: def.title(r) };
    for (const colName of def.listColumns) {
      const f = fieldByName(def, colName);
      out[colName] = f?.widget === "fk" && f.fkTo ? fkMaps[colName]?.[r[colName]] ?? "" : r[colName];
    }
    return out as any;
  });

  return (
    <div>
      <PageHeader title={def.label} subtitle={def.blurb}>
        <Link href={`/${def.key}/new`} className="btn-primary">
          + New {def.singular.toLowerCase()}
        </Link>
      </PageHeader>
      {dataRows.length > 0 ? (
        <DataTable rows={dataRows} columns={columns} basePath={`/${def.key}`} searchPlaceholder={`Search ${def.label.toLowerCase()}…`} />
      ) : (
        <EmptyState
          message={`No ${def.label.toLowerCase()} yet.`}
          cta={
            <Link href={`/${def.key}/new`} className="btn-primary">
              + Add the first one
            </Link>
          }
        />
      )}
    </div>
  );
}
