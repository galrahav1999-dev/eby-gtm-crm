import { notFound } from "next/navigation";
import { getObjectDef } from "@/lib/schema/registry";
import { getFormBundle } from "@/lib/record-data";
import { PageHeader } from "@/components/crm/ui";
import { RecordForm } from "@/components/crm/RecordForm";
import { createRecordAction } from "@/lib/record-actions";

export const dynamic = "force-dynamic";

export default async function NewRecordPage({ params }: { params: { object: string } }) {
  const def = getObjectDef(params.object);
  if (!def) notFound();
  const { options, fk } = await getFormBundle(def);

  return (
    <div>
      <PageHeader back title={`New ${def.singular.toLowerCase()}`} subtitle="Fill in what you know; you can complete the rest later." />
      <RecordForm
        fields={def.fields}
        options={options}
        fk={fk}
        action={createRecordAction.bind(null, def.key)}
        submitLabel={`Create ${def.singular.toLowerCase()}`}
        cancelHref={`/${def.key}`}
      />
    </div>
  );
}
