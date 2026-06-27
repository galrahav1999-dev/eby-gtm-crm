import { getAllOptions } from "@/lib/options";
import { getOrgOptions, getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { PilotForm } from "@/components/crm/PilotForm";
import { createPilot } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPilotPage() {
  const [options, orgs, people] = await Promise.all([getAllOptions(), getOrgOptions(), getPeopleOptions()]);
  return (
    <div>
      <PageHeader back title="New pilot" />
      <PilotForm action={createPilot} options={options} orgs={orgs} people={people} />
    </div>
  );
}
