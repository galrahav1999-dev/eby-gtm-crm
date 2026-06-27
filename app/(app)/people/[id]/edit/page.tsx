import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { PageHeader } from "@/components/crm/ui";
import { PersonForm } from "@/components/crm/PersonForm";
import { updatePerson } from "../../actions";
import type { Person } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function EditPersonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: person }, options, { data: orgs }] = await Promise.all([
    supabase.from("people").select("*").eq("id", params.id).single<Person>(),
    getAllOptions(),
    supabase.from("organizations").select("id, name").order("name"),
  ]);
  if (!person) notFound();
  const orgOptions = (orgs ?? []).map((o) => ({ id: o.id, label: o.name }));

  return (
    <div>
      <PageHeader title={`Edit ${[person.first_name, person.last_name].filter(Boolean).join(" ") || "person"}`} />
      <PersonForm action={updatePerson.bind(null, person.id)} options={options} orgs={orgOptions} person={person} />
    </div>
  );
}
