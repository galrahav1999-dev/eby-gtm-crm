"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Organization } from "@/lib/db-types";
import { COUNTRIES_FULL } from "@/lib/countries";
import { TextField, TextArea, SubmitButton } from "./form";
import { Combobox } from "./Combobox";

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
          <Combobox name="org_type" label="Org type" options={options.org_type ?? []} defaultValue={org?.org_type} fieldKey="org_type" />
          <Combobox name="age_band" label="Age / grade band" options={options.age_band ?? []} defaultValue={org?.age_band} fieldKey="age_band" />
          <Combobox name="denomination" label="Denomination" options={options.denomination ?? []} defaultValue={org?.denomination} fieldKey="denomination" />
          <Combobox name="segment" label="Segment" options={options.segment ?? []} defaultValue={org?.segment} fieldKey="segment" />
          <TextField name="city" label="City" defaultValue={org?.city} />
          <Combobox name="country" label="Country" options={COUNTRIES_FULL} defaultValue={org?.country} placeholder="Search countries…" />
          <TextField name="size" label="Size (students / seats)" defaultValue={org?.size} />
          <TextField name="affiliation" label="Affiliation / network" defaultValue={org?.affiliation} />
          <Combobox name="owner" label="Owner" options={options.owner ?? []} defaultValue={org?.owner} fieldKey="owner" />
          <Combobox name="status" label="Status" options={options.org_status ?? []} defaultValue={org?.status} fieldKey="org_status" />
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
