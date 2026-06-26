"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import { TextField, TextArea, SelectField, DateField, RecordSelect, SubmitButton } from "./form";

export function InteractionForm({
  action,
  options,
  orgs,
  people,
  deals,
  defaults,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  orgs: { id: string; label: string }[];
  people: { id: string; label: string }[];
  deals: { id: string; label: string }[];
  defaults?: { person_id?: string; org_id?: string; deal_id?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateField name="date" label="Date" defaultValue={today} />
          <SelectField name="type" label="Type" options={options.interaction_type ?? []} />
          <RecordSelect name="person_id" label="Person" records={people} defaultValue={defaults?.person_id} />
          <RecordSelect name="org_id" label="Organization" records={orgs} defaultValue={defaults?.org_id} />
          <RecordSelect name="deal_id" label="Deal" records={deals} defaultValue={defaults?.deal_id} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} />
        </div>
        <div className="mt-4 space-y-4">
          <TextArea name="outcome" label="What happened / outcome" rows={3} />
          <TextArea
            name="verbatim_quote"
            label="Verbatim quote / key signal"
            rows={2}
            hint="Their exact words. This is the Mom-Test gold."
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="next_step" label="Next step" />
          <DateField name="next_step_date" label="Next-step date" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label="Log interaction" />
        <Link href="/interactions" className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
