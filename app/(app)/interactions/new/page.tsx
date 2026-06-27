import { getAllOptions } from "@/lib/options";
import { getOrgOptions, getPeopleOptions, getDealOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { InteractionForm } from "@/components/crm/InteractionForm";
import { createInteraction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewInteractionPage({
  searchParams,
}: {
  searchParams: { person?: string; org?: string; deal?: string };
}) {
  const [options, orgs, people, deals] = await Promise.all([
    getAllOptions(),
    getOrgOptions(),
    getPeopleOptions(),
    getDealOptions(),
  ]);
  return (
    <div>
      <PageHeader back title="Log interaction" subtitle="Capture the call while it's fresh. Quote them verbatim." />
      <InteractionForm
        action={createInteraction}
        options={options}
        orgs={orgs}
        people={people}
        deals={deals}
        defaults={{ person_id: searchParams.person, org_id: searchParams.org, deal_id: searchParams.deal }}
      />
    </div>
  );
}
