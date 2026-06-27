import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { getOrgOptions, getPeopleOptions } from "@/lib/pickers";
import { PageHeader } from "@/components/crm/ui";
import { PilotForm } from "@/components/crm/PilotForm";
import { updatePilot } from "../../actions";
import type { Pilot } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditPilotPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: pilot }, options, orgs, people] = await Promise.all([
    supabase.from("pilots").select("*").eq("id", params.id).single<Pilot>(),
    getAllOptions(),
    getOrgOptions(),
    getPeopleOptions(),
  ]);
  if (!pilot) notFound();
  return (
    <div>
      <PageHeader back title="Edit pilot" />
      <PilotForm action={updatePilot.bind(null, pilot.id)} options={options} orgs={orgs} people={people} pilot={pilot} />
    </div>
  );
}
