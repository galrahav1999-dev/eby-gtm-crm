import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { getOrgOptions, getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { DealForm } from "@/components/crm/DealForm";
import { updateDeal } from "../../actions";
import type { Deal } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: deal }, options, orgs, people] = await Promise.all([
    supabase.from("deals").select("*").eq("id", params.id).single<Deal>(),
    getAllOptions(),
    getOrgOptions(),
    getPeopleOptions(),
  ]);
  if (!deal) notFound();

  return (
    <div>
      <PageHeader back title={`Edit ${deal.name}`} />
      <DealForm action={updateDeal.bind(null, deal.id)} options={options} orgs={orgs} people={people} deal={deal} />
    </div>
  );
}
