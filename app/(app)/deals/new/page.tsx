import { getAllOptions } from "@/lib/options";
import { getOrgOptions, getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { DealForm } from "@/components/crm/DealForm";
import { createDeal } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const [options, orgs, people] = await Promise.all([
    getAllOptions(),
    getOrgOptions(),
    getPeopleOptions(),
  ]);
  return (
    <div>
      <PageHeader back title="New deal" subtitle="Only the deal name is required." />
      <DealForm action={createDeal} options={options} orgs={orgs} people={people} />
    </div>
  );
}
