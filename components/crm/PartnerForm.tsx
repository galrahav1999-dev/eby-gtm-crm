"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Partner } from "@/lib/db-types";
import { TextField, TextArea, SelectField, DateField, RecordSelect, SubmitButton } from "./form";

export function PartnerForm({
  action,
  options,
  people,
  partner,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  people: { id: string; label: string }[];
  partner?: Partner;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="partner_org" label="Partner organization" defaultValue={partner?.partner_org} required />
          <SelectField name="partner_type" label="Partner type" options={options.partner_type ?? []} defaultValue={partner?.partner_type} />
          <RecordSelect name="primary_contact_id" label="Primary contact" records={people} defaultValue={partner?.primary_contact_id} />
          <SelectField name="stage" label="Stage" options={options.partner_stage ?? []} defaultValue={partner?.stage} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} defaultValue={partner?.owner} />
          <TextField name="expected_reach" label="Expected reach (# end-customers)" defaultValue={partner?.expected_reach} />
        </div>
        <div className="mt-4 space-y-4">
          <TextField name="what_they_give" label="What they give us (reach / access)" defaultValue={partner?.what_they_give} />
          <TextField name="terms" label="Commission / terms" defaultValue={partner?.terms} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField name="next_step" label="Next step" defaultValue={partner?.next_step} />
            <DateField name="next_step_date" label="Next-step date" defaultValue={partner?.next_step_date} />
          </div>
          <TextArea name="notes" label="Notes" defaultValue={partner?.notes} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={partner ? "Save changes" : "Create partner"} />
        <Link href={partner ? `/partners/${partner.id}` : "/partners"} className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
