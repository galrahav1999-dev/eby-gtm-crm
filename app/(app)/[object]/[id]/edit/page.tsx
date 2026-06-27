import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getObjectDef } from "@/lib/schema/registry";
import { getFormBundle } from "@/lib/record-data";
import { PageHeader } from "@/components/crm/ui";
import { RecordForm } from "@/components/crm/RecordForm";
import { updateRecordAction } from "@/lib/record-actions";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({ params }: { params: { object: string; id: string } }) {
  const def = getObjectDef(params.object);
  if (!def) notFound();
  const supabase = createClient();
  const { data: record } = await supabase.from(def.table).select("*").eq("id", params.id).single();
  if (!record) notFound();
  const { options, fk } = await getFormBundle(def);

  return (
    <div>
      <PageHeader back title={`Edit ${def.title(record)}`} />
      <RecordForm
        fields={def.fields}
        record={record}
        options={options}
        fk={fk}
        action={updateRecordAction.bind(null, def.key, params.id)}
        submitLabel="Save changes"
        cancelHref={`/${def.key}/${params.id}`}
      />
    </div>
  );
}
