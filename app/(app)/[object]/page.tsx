import Link from "next/link";
import { notFound } from "next/navigation";
import { getObjectDef } from "@/lib/schema/registry";
import { loadActive, fkLabelMap } from "@/lib/record-data";
import { getAllOptions } from "@/lib/options";
import { stageGuide } from "@/lib/schema/stage-guide";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { DataTable, type Column } from "@/components/crm/DataTable";
import { Board, type BoardCard } from "@/components/crm/Board";
import type { FieldDef, ObjectDef } from "@/lib/schema/types";

export const dynamic = "force-dynamic";

function colKind(f: FieldDef): Column["kind"] {
  if (f.widget === "date") return f.name === "next_step_date" ? "nextdate" : "date";
  if (f.widget === "combobox" || f.widget === "select") return f.optionsKey === "owner" ? "owner" : "badge";
  return "text";
}

/** Segmented Table / Board switch, rendered as links so the view survives reloads. */
function ViewTabs({ base, view }: { base: string; view: "table" | "board" }) {
  const tab = (key: "table" | "board", label: string) => (
    <Link
      href={key === "table" ? base : `${base}?view=board`}
      className={`px-3 py-1.5 text-xs font-medium transition ${
        view === key ? "bg-primary text-primary-contrast" : "text-ink-soft hover:bg-surface-muted"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-line">
      {tab("table", "Table")}
      {tab("board", "Board")}
    </div>
  );
}

async function buildBoard(def: ObjectDef, rows: Record<string, any>[], stageField: FieldDef) {
  const moneyField = def.fields.find((f) => f.widget === "money");
  const orgField = def.fields.find((f) => f.widget === "fk" && f.fkTo === "organizations");
  const orgMap = orgField ? await fkLabelMap("organizations", rows.map((r) => r[orgField.name])) : {};
  const options = await getAllOptions();
  const stages = (stageField.optionsKey ? options[stageField.optionsKey] : undefined) ?? [];

  const cards: BoardCard[] = rows.map((r) => ({
    id: r.id,
    displayId: r.display_id ?? null,
    title: def.title(r),
    org: orgField ? orgMap[r[orgField.name]] ?? null : null,
    owner: r.owner ?? null,
    priority: r.priority ?? null,
    value: moneyField && r[moneyField.name] != null ? Number(r[moneyField.name]) : null,
    stage: r.stage ?? null,
    nextStepDate: r.next_step_date ?? null,
  }));

  return { cards, stages, guide: stageGuide(stageField.optionsKey) };
}

export default async function ListPage({
  params,
  searchParams,
}: {
  params: { object: string };
  searchParams: { view?: string };
}) {
  const def = getObjectDef(params.object);
  if (!def) notFound();

  const rows = await loadActive(def);
  const stageField = def.fields.find((f) => f.name === "stage");
  const hasBoard = !!stageField;
  const view: "table" | "board" = hasBoard && searchParams.view === "board" ? "board" : "table";

  const fields = def.fields;

  const header = (
    <PageHeader title={def.label} subtitle={def.blurb}>
      {hasBoard && <ViewTabs base={`/${def.key}`} view={view} />}
      <Link href={`/${def.key}/new`} className="btn-primary">
        + New {def.singular.toLowerCase()}
      </Link>
    </PageHeader>
  );

  if (rows.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          message={`No ${def.label.toLowerCase()} yet.`}
          cta={
            <Link href={`/${def.key}/new`} className="btn-primary">
              + Add the first one
            </Link>
          }
        />
      </div>
    );
  }

  if (view === "board" && stageField) {
    const { cards, stages, guide } = await buildBoard(def, rows, stageField);
    return (
      <div>
        {header}
        <Board cards={cards} stages={stages} guide={guide} basePath={`/${def.key}`} objectKey={def.key} />
      </div>
    );
  }

  // Table view: every editable field becomes a column, so the table maps 1:1 to the DB.
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
      {header}
      <DataTable rows={dataRows} columns={columns} basePath={`/${def.key}`} searchPlaceholder={`Search ${def.label.toLowerCase()}…`} />
    </div>
  );
}
