import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getObjectDef } from "@/lib/schema/registry";
import type { FieldDef } from "@/lib/schema/types";
import { getLinked, fkLabelMap } from "@/lib/record-data";
import { DetailField, Badge, IdTag } from "@/components/crm/ui";
import { BackButton } from "@/components/crm/BackButton";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { QuickAddButton } from "@/components/crm/QuickAddButton";
import { archiveRecordAction } from "@/lib/record-actions";
import { fmtDate, isOverdue } from "@/lib/format";
import { labelColor } from "@/lib/colors";

export const dynamic = "force-dynamic";

// Enum-ish fields worth showing as chips in the identity panel, in priority order.
const CHIP_FIELDS = ["stage", "status", "org_status", "priority", "org_type", "partner_type", "type", "lifecycle"];

function monogram(title: string): string {
  const parts = title.replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function renderValue(field: FieldDef, value: any, fkLabel?: string, fkKey?: string) {
  if (value == null || value === "") return null;
  switch (field.widget) {
    case "combobox":
    case "select":
      return <Badge value={String(value)} kind={field.optionsKey === "owner" ? "owner" : "label"} />;
    case "date":
      return field.name === "next_step_date" && isOverdue(value) ? (
        <span className="font-medium text-danger">{fmtDate(value)} (due)</span>
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

  const fkResolved: Record<string, { label: string; key: string }> = {};
  for (const f of def.fields) {
    if (f.widget === "fk" && f.fkTo && record[f.name]) {
      const m = await fkLabelMap(f.fkTo, [record[f.name]]);
      if (m[record[f.name]]) fkResolved[f.name] = { label: m[record[f.name]], key: f.fkTo };
    }
  }

  const linked = await getLinked(def, params.id);

  const shown = def.fields.filter((f) => f.showInDetail !== false);
  const sections: { name: string; fields: FieldDef[] }[] = [];
  for (const f of shown) {
    const key = f.section ?? "Details";
    let s = sections.find((x) => x.name === key);
    if (!s) sections.push((s = { name: key, fields: [] }));
    s.fields.push(f);
  }

  const title = def.title(record);
  const tint = labelColor(title);
  const chips = CHIP_FIELDS.filter((k) => record[k]);
  const location = [record.city, record.country].filter(Boolean).join(", ");
  // Objects a conversation can be logged against get a "Log conversation" action.
  const canLog = ["organizations", "people", "deals"].includes(def.key);

  return (
    <div>
      <BackButton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity panel */}
        <aside className="lg:col-span-1">
          <div className="card p-5 lg:sticky lg:top-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white ring-1 ring-black/5"
              style={{ background: `linear-gradient(140deg, ${tint}, ${tint}b3)` }}
            >
              {monogram(title)}
            </div>
            <h1 className="mt-3 text-xl font-semibold leading-tight text-ink">{title}</h1>
            <div className="mt-1">
              <IdTag id={record.display_id} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {record.owner && <Badge value={record.owner} kind="owner" />}
              {record.segment && <Badge value={record.segment} />}
              {chips.map((k) => (
                <Badge key={k} value={String(record[k])} />
              ))}
            </div>

            {location && <div className="mt-3 text-sm text-ink-muted">{location}</div>}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
              {!def.appendOnly && (
                <Link href={`/${def.key}/${params.id}/edit`} className="btn-ghost text-xs">
                  Edit
                </Link>
              )}
              {canLog && (
                <Link href="/logger" className="btn-ghost text-xs">
                  Log conversation
                </Link>
              )}
              {!def.appendOnly && (
                <DeleteButton
                  action={archiveRecordAction.bind(null, def.key, params.id)}
                  label="Archive"
                  confirmText={`Archive this ${def.singular.toLowerCase()}? It can be restored later.`}
                />
              )}
            </div>
          </div>
        </aside>

        {/* Data + linked-records hub */}
        <div className="space-y-4 lg:col-span-2">
          {sections.map((s) => (
            <section key={s.name} className="card p-5">
              <h2 className="label-eyebrow mb-3">{s.name}</h2>
              <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {s.fields.map((f) => (
                  <DetailField key={f.name} label={f.label}>
                    {renderValue(f, record[f.name], fkResolved[f.name]?.label, fkResolved[f.name]?.key)}
                  </DetailField>
                ))}
              </div>
            </section>
          ))}

          {linked.map((l) => {
            const tdef = getObjectDef(l.objectKey);
            const linkDef = def.linked?.find((x) => x.object === l.objectKey);
            return (
              <section key={l.label} className="card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="label-eyebrow">
                    {l.label} <span className="text-ink-muted">({l.rows.length})</span>
                  </h2>
                  {tdef && linkDef && (
                    <QuickAddButton
                      object={l.objectKey}
                      prefill={{ [linkDef.fk]: params.id }}
                      label={`+ Add ${tdef.singular.toLowerCase()}`}
                    />
                  )}
                </div>
                {l.rows.length > 0 ? (
                  <div className="divide-y divide-line-soft">
                    {l.rows.map((r) => (
                      <Link
                        key={r.id}
                        href={`/${l.objectKey}/${r.id}`}
                        className="block px-1 py-2.5 text-sm text-ink-soft transition hover:text-primary"
                      >
                        {r.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">None yet.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
