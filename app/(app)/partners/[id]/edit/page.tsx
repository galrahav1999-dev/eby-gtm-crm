import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { PartnerForm } from "@/components/crm/PartnerForm";
import { updatePartner } from "../../actions";
import type { Partner } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditPartnerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: partner }, options, people] = await Promise.all([
    supabase.from("partners").select("*").eq("id", params.id).single<Partner>(),
    getAllOptions(),
    getPeopleOptions(),
  ]);
  if (!partner) notFound();
  return (
    <div>
      <PageHeader back title={`Edit ${partner.partner_org}`} />
      <PartnerForm action={updatePartner.bind(null, partner.id)} options={options} people={people} partner={partner} />
    </div>
  );
}
