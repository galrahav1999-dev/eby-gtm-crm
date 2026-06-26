"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Person } from "@/lib/db-types";
import { TextField, TextArea, SelectField, DateField, RecordSelect, SubmitButton } from "./form";

export function PersonForm({
  action,
  options,
  orgs,
  person,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  orgs: { id: string; label: string }[];
  person?: Person;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="first_name" label="First name" defaultValue={person?.first_name} />
          <TextField name="last_name" label="Last name" defaultValue={person?.last_name} />
          <TextField name="email" label="Email" defaultValue={person?.email} placeholder="name@example.com" />
          <SelectField name="role_title" label="Role / title" options={options.person_role ?? []} defaultValue={person?.role_title} />
          <RecordSelect name="org_id" label="Organization" records={orgs} defaultValue={person?.org_id} hint="Link to a school / org, or leave blank for an individual." />
          <SelectField name="segment" label="Segment" options={options.segment ?? []} defaultValue={person?.segment} />
          <TextField name="city" label="City" defaultValue={person?.city} />
          <SelectField name="country" label="Country" options={options.country ?? []} defaultValue={person?.country} />
          <SelectField name="source" label="Source" options={options.source ?? []} defaultValue={person?.source} />
          <SelectField name="lifecycle" label="Lifecycle" options={options.lifecycle ?? []} defaultValue={person?.lifecycle} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} defaultValue={person?.owner} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="next_step" label="Next step" defaultValue={person?.next_step} placeholder="e.g. Send pilot one-pager" />
          <DateField name="next_step_date" label="Next-step date" defaultValue={person?.next_step_date} hint="Turns red on the dashboard when overdue." />
        </div>

        <div className="mt-4">
          <TextArea name="notes" label="Notes" defaultValue={person?.notes} rows={4} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={person ? "Save changes" : "Create person"} />
        <Link href={person ? `/people/${person.id}` : "/people"} className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
