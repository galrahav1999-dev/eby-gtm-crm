import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getObjectDef } from "@/lib/schema/registry";
import type { FieldDef } from "@/lib/schema/types";
import { getLinked, fkLabelMap } from "@/lib/record-data";
import { PageHeader, DetailField, Badge, IdTag } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { archiveRecordAction } from "@/lib/record-actions";
import { fmtDate, isOverdue } from "@/lib/format";

export const dynamic = "force-dynamic";

function renderValue(field: FieldDef, value: any, fkLabel?: string, fkKey?: string) {
  if (value == null || value === "") return null;
  switch (field.widget) {
    case "combobox":
    case "select":
      return <Badge value={String(value)} kind={field.optionsKey === "owner" ? "owner" : "label"} />;
    case "date":
      return field.name === "next_step_date" && isOverdue(value) ? (
        <span className="font-medium text-rose-300">{fmtDate(value)} (due)</span>
      ) : (
        <span>{fmtDate(value)}</span>
      );
    case "money":
      return <span>${Number(value).toLocaleString()}</span>;
    case "fk":
      return fkLabel ? (
        <Link href={`/${fkKey}/${value}`} className="text-primary hover:underline">
          {fkLabel}
        </Link>
      ) : null;
    default:
      return field.quote ? <span className="italic text-ink-soft">“{String(value)}”</span> : <span>{String(value)}</span>;
  }
}

export default async function DetailPage({ params }: { params: { object: string; id: string } }) {
  const def = getObjectDef(params.object);
  if (!def) notFound();
  const supabase = createClient();
  const { data: record } = await supabase.from(def.table).select("*").eq("id", params.id).single();
  if (!record) notFound();

  // Resolve FK labels for fk fields.
  const fkResolved: Record<string, { label: string; key: string }> = {};
  for (const f of def.fields) {
    if (f.widget === "fk" && f.fkTo && record[f.name]) {
      const m = await fkLabelMap(f.fkTo, [record[f.name]]);
      if (m[record[f.name]]) fkResolved[f.name] = { label: m[record[f.name]], key: f.fkTo };
    }
  }

  const linked = await getLinked(def, params.id);

  // group detail fields by section
  const shown = def.fields.filter((f) => f.showInDetail !== false);
  const sections: { name: string; fields: FieldDef[] }[] = [];
  for (const f of shown) {
    const key = f.section ?? "Details";
    let s = sections.find((x) => x.name === key);
    if (!s) sections.push((s = { name: key, fields: [] }));
    s.fields.push(f);
  }

  return (
    <div>
      <PageHeader back title={def.title(record)}>
        <Link href={`/${def.key}/${params.id}/edit`} className="btn-ghost">
          Edit
        </Link>
        <DeleteButton
          action={archiveRecordAction.bind(null, def.key, params.id)}
          label="Archive"
          confirmText={`Archive this ${def.singular.toLowerCase()}? It can be restored later.`}
        />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IdTag id={record.display_id} />
        {record.segment && <Badge value={record.segment} />}
        {record.owner && <Badge value={record.owner} kind="owner" />}
      </div>

      {sections.map((s) => (
        <div key={s.name} className="mb-2">
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {s.fields.map((f) => (
              <DetailField key={f.name} label={f.label}>
                {renderValue(f, record[f.name], fkResolved[f.name]?.label, fkResolved[f.name]?.key)}
              </DetailField>
            ))}
          </div>
        </div>
      ))}

      {linked.map((l) => (
        <section key={l.label} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">{l.label}</h2>
          {l.rows.length > 0 ? (
            <div className="card divide-y divide-line">
              {l.rows.map((r) => (
                <Link key={r.id} href={`/${l.objectKey}/${r.id}`} className="block px-4 py-2.5 text-sm text-ink-soft transition hover:bg-surface-muted">
                  {r.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">None yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}
