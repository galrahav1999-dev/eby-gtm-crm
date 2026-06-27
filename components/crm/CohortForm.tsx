"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { WaitlistCohort } from "@/lib/db-types";
import { TextField, NumberField, TextArea, SelectField, SubmitButton } from "./form";

export function CohortForm({
  action,
  options,
  cohort,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  cohort?: WaitlistCohort;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="cohort_label" label="Cohort (month + source)" defaultValue={cohort?.cohort_label} required placeholder="e.g. 2026-06 Excel referral" />
          <SelectField name="segment" label="Segment" options={options.segment ?? []} defaultValue={cohort?.segment} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <NumberField name="signups" label="Signups" defaultValue={cohort?.signups} />
          <NumberField name="confirmed" label="Confirmed" defaultValue={cohort?.confirmed} />
          <NumberField name="activated" label="Activated" defaultValue={cohort?.activated} />
          <NumberField name="retained_d30" label="Retained (D30)" defaultValue={cohort?.retained_d30} />
          <NumberField name="paid" label="Paid" defaultValue={cohort?.paid} />
        </div>
        <div className="mt-4">
          <TextArea name="notes" label="Notes" defaultValue={cohort?.notes} rows={2} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={cohort ? "Save changes" : "Add cohort"} />
        <Link href="/waitlist" className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
