import { getAllOptions } from "@/lib/options";
import { getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { PartnerForm } from "@/components/crm/PartnerForm";
import { createPartner } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  const [options, people] = await Promise.all([getAllOptions(), getPeopleOptions()]);
  return (
    <div>
      <PageHeader back title="New partner" subtitle="Only the partner organization is required." />
      <PartnerForm action={createPartner} options={options} people={people} />
    </div>
  );
}
