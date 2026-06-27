import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { PersonForm } from "@/components/crm/PersonForm";
import { createPerson } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPersonPage() {
  const supabase = createClient();
  const [options, { data: orgs }] = await Promise.all([
    getAllOptions(),
    supabase.from("organizations").select("id, name, display_id").order("name"),
  ]);
  const orgOptions = (orgs ?? []).map((o) => ({ id: o.id, label: o.name }));

  return (
    <div>
      <PageHeader back title="New person" subtitle="Nothing is required; capture what you know now and fill the rest later." />
      <PersonForm action={createPerson} options={options} orgs={orgOptions} />
    </div>
  );
}
