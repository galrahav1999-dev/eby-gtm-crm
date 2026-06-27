"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Organization } from "@/lib/db-types";
import { TextField, TextArea, SelectField, SubmitButton } from "./form";

export function OrgForm({
  action,
  options,
  org,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  org?: Organization;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="name" label="Organization name" defaultValue={org?.name} required />
          <TextField name="domain" label="Website / domain" defaultValue={org?.domain} placeholder="example.org" />
          <SelectField name="org_type" label="Org type" options={options.org_type ?? []} defaultValue={org?.org_type} />
          <SelectField name="age_band" label="Age / grade band" options={options.age_band ?? []} defaultValue={org?.age_band} />
          <SelectField name="denomination" label="Denomination" options={options.denomination ?? []} defaultValue={org?.denomination} />
          <SelectField name="segment" label="Segment" options={options.segment ?? []} defaultValue={org?.segment} />
          <TextField name="city" label="City" defaultValue={org?.city} />
          <SelectField name="country" label="Country" options={options.country ?? []} defaultValue={org?.country} />
          <TextField name="size" label="Size (students / seats)" defaultValue={org?.size} />
          <TextField name="affiliation" label="Affiliation / network" defaultValue={org?.affiliation} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} defaultValue={org?.owner} />
          <SelectField name="status" label="Status" options={options.org_status ?? []} defaultValue={org?.status} />
        </div>
        <div className="mt-4">
          <TextArea name="notes" label="Notes" defaultValue={org?.notes} rows={4} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={org ? "Save changes" : "Create organization"} />
        <Link href={org ? `/organizations/${org.id}` : "/organizations"} className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
