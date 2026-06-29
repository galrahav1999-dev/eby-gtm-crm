import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjectDef } from "@/lib/schema/registry";
import { loadActive, fkLabelMap } from "@/lib/record-data";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";
import type { FieldDef } from "@/lib/schema/types";

export const dynamic = "force-dynamic";

function colKind(f: FieldDef): Column["kind"] {
  if (f.widget === "date") return f.name === "next_step_date" ? "nextdate" : "date";
  if (f.widget === "combobox" || f.widget === "select") return f.optionsKey === "owner" ? "owner" : "badge";
  return "text";
}

export default async function ListPage({ params }: { params: { object: string } }) {
  const def = getObjectDef(params.object);
  if (!def) notFound();

  const rows = await loadActive(def);

  // Every editable field becomes a column, so the table maps 1:1 to the DB.
  const fields = def.fields;

  // Resolve labels for all FK columns shown.
  const fkMaps: Record<string, Record<string, string>> = {};
  for (const f of fields) {
    if (f.widget === "fk" && f.fkTo) {
      fkMaps[f.name] = await fkLabelMap(f.fkTo, rows.map((r) => r[f.name]));
    }
  }

  const columns: Column[] = [
    { key: "display_id", header: "ID", kind: "id" },
    { key: "__title", header: def.singular, kind: "strong" },
    ...fields.map((f): Column => ({ key: f.name, header: f.label, kind: colKind(f) })),
  ];

  const dataRows = rows.map((r) => {
    const out: Record<string, unknown> = { id: r.id, display_id: r.display_id, __title: def.title(r) };
    for (const f of fields) {
      if (f.widget === "fk" && f.fkTo) out[f.name] = fkMaps[f.name]?.[r[f.name]] ?? "";
      else if (f.widget === "money") out[f.name] = r[f.name] == null ? "" : `$${Number(r[f.name]).toLocaleString()}`;
      else out[f.name] = r[f.name];
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
