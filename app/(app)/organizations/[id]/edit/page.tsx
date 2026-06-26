import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { OrgForm } from "@/components/crm/OrgForm";
import { updateOrganization } from "../../actions";
import type { Organization } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: org }, options] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", params.id).single<Organization>(),
    getAllOptions(),
  ]);
  if (!org) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${org.name}`} />
      <OrgForm action={updateOrganization.bind(null, org.id)} options={options} org={org} />
    </div>
  );
}
