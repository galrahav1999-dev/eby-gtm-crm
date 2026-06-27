import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { CohortForm } from "@/components/crm/CohortForm";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { updateCohort, deleteCohort } from "../../actions";
import type { WaitlistCohort } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditCohortPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: cohort }, options] = await Promise.all([
    supabase.from("waitlist_cohorts").select("*").eq("id", params.id).single<WaitlistCohort>(),
    getAllOptions(),
  ]);
  if (!cohort) notFound();
  return (
    <div>
      <PageHeader back title={`Edit ${cohort.cohort_label}`}>
        <DeleteButton action={deleteCohort.bind(null, cohort.id)} confirmText="Delete this cohort?" />
      </PageHeader>
      <CohortForm action={updateCohort.bind(null, cohort.id)} options={options} cohort={cohort} />
    </div>
  );
}
