import { notFound } from "next/navigation";
import { getObjectDef } from "@/lib/schema/registry";
import { getFormBundle } from "@/lib/record-data";
import { PageHeader } from "@/components/crm/ui";
import { RecordForm } from "@/components/crm/RecordForm";
import { createRecordAction } from "@/lib/record-actions";

export const dynamic = "force-dynamic";

export default async function NewRecordPage({
  params,
  searchParams,
}: {
  params: { object: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const def = getObjectDef(params.object);
  if (!def) notFound();
  const { options, fk } = await getFormBundle(def);

  // Prefill fields from query params (e.g. /deals/new?org_id=...), so the AI
  // logger's "start a deal/pilot for this org" lands ready to complete.
  const prefill: Record<string, any> = {};
  for (const f of def.fields) {
    const v = searchParams[f.name];
    if (typeof v === "string" && v !== "") prefill[f.name] = v;
  }

  return (
    <div>
      <PageHeader back title={`New ${def.singular.toLowerCase()}`} subtitle="Fill in what you know; you can complete the rest later." />
      <RecordForm
        fields={def.fields}
        record={Object.keys(prefill).length ? prefill : undefined}
        options={options}
        fk={fk}
        action={createRecordAction.bind(null, def.key)}
        submitLabel={`Create ${def.singular.toLowerCase()}`}
        cancelHref={`/${def.key}`}
      />
    </div>
  );
}
