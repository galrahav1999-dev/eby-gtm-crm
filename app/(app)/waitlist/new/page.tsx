import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { CohortForm } from "@/components/crm/CohortForm";
import { createCohort } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCohortPage() {
  const options = await getAllOptions();
  return (
    <div>
      <PageHeader title="Add cohort" subtitle="Track the B2C funnel one cohort at a time." />
      <CohortForm action={createCohort} options={options} />
    </div>
  );
}
