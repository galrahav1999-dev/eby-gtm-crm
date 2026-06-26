"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Pilot } from "@/lib/db-types";
import { TextField, TextArea, SelectField, DateField, RecordSelect, SubmitButton } from "./form";

export function PilotForm({
  action,
  options,
  orgs,
  people,
  pilot,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  orgs: { id: string; label: string }[];
  people: { id: string; label: string }[];
  pilot?: Pilot;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RecordSelect name="org_id" label="Organization" records={orgs} defaultValue={pilot?.org_id} />
          <RecordSelect name="champion_id" label="Champion" records={people} defaultValue={pilot?.champion_id} />
          <SelectField name="stage" label="Stage" options={options.pilot_stage ?? []} defaultValue={pilot?.stage} />
          <SelectField name="urgency" label="Urgency (real, burning need?)" options={options.urgency ?? []} defaultValue={pilot?.urgency} />
          <SelectField name="feedback_cadence" label="Feedback cadence" options={options.feedback_cadence ?? []} defaultValue={pilot?.feedback_cadence} />
          <SelectField name="dpa_signed" label="DPA signed?" options={options.yes_no_unknown ?? []} defaultValue={pilot?.dpa_signed} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} defaultValue={pilot?.owner} />
          <DateField name="convert_by" label="Convert-by date" defaultValue={pilot?.convert_by} />
        </div>
        <div className="mt-4 space-y-4">
          <TextField name="capability" label="Capability (can they implement?)" defaultValue={pilot?.capability} />
          <TextField name="representativeness" label="Representativeness (typical of market?)" defaultValue={pilot?.representativeness} />
          <TextField name="success_metric" label="Success metric agreed" defaultValue={pilot?.success_metric} />
          <TextField name="next_step" label="Next step" defaultValue={pilot?.next_step} />
          <TextArea name="notes" label="Notes" defaultValue={pilot?.notes} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={pilot ? "Save changes" : "Create pilot"} />
        <Link href={pilot ? `/pilots/${pilot.id}` : "/pilots"} className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
