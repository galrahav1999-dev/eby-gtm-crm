import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { OrgForm } from "@/components/crm/OrgForm";
import { createOrganization } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOrganizationPage() {
  const options = await getAllOptions();
  return (
    <div>
      <PageHeader back title="New organization" subtitle="Only the name is required; fill in the rest as you learn it." />
      <OrgForm action={createOrganization} options={options} />
    </div>
  );
}
