"use client";

import Link from "next/link";
import type { OptionsMap } from "@/lib/options";
import type { Deal } from "@/lib/db-types";
import {
  TextField,
  TextArea,
  SelectField,
  DateField,
  NumberField,
  RecordSelect,
  SubmitButton,
} from "./form";

export function DealForm({
  action,
  options,
  orgs,
  people,
  deal,
}: {
  action: (fd: FormData) => Promise<void>;
  options: OptionsMap;
  orgs: { id: string; label: string }[];
  people: { id: string; label: string }[];
  deal?: Deal;
}) {
  return (
    <form action={action} className="space-y-5">
      {/* Basics */}
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Basics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="name" label="Deal name" defaultValue={deal?.name} required placeholder="e.g. Hartman - K8 spoken Hebrew pilot" />
          <RecordSelect name="org_id" label="Organization" records={orgs} defaultValue={deal?.org_id} />
          <SelectField name="stage" label="Stage" options={options.b2b_stage ?? []} defaultValue={deal?.stage} />
          <SelectField name="priority" label="Priority" options={options.priority ?? []} defaultValue={deal?.priority} />
          <SelectField name="owner" label="Owner" options={options.owner ?? []} defaultValue={deal?.owner} />
        </div>
      </section>

      {/* The three buyer roles */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink">Who's who</h2>
        <p className="mb-4 text-xs text-ink-muted">Can be the same person or different people.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <RecordSelect name="economic_buyer_id" label="Economic buyer" records={people} defaultValue={deal?.economic_buyer_id} hint="Controls budget, signs." />
          <RecordSelect name="poc_id" label="Point of contact" records={people} defaultValue={deal?.poc_id} hint="Day-to-day coordinator." />
          <RecordSelect name="champion_id" label="Champion" records={people} defaultValue={deal?.champion_id} hint="Advocates for us inside." />
        </div>
      </section>

      {/* Qualification, in their words */}
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Qualification (Mom Test)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField name="has_hebrew" label="Has a Hebrew program today?" options={options.yes_no_unknown ?? []} defaultValue={deal?.has_hebrew} />
          <TextField name="current_solution" label="Current solution / curriculum" defaultValue={deal?.current_solution} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <TextArea name="current_state" label="Current state (how it's going)" defaultValue={deal?.current_state} rows={2} />
          <TextArea name="pains" label="Pains (their words)" defaultValue={deal?.pains} rows={3} hint="Quote them verbatim. This is the real signal." />
          <TextArea name="ideal_state" label="Ideal state (what good looks like)" defaultValue={deal?.ideal_state} rows={2} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField name="eval_timing" label="Eval start timing" options={options.eval_timing ?? []} defaultValue={deal?.eval_timing} />
          <SelectField name="decision_timeline" label="Decision timeline" options={options.decision_timeline ?? []} defaultValue={deal?.decision_timeline} />
        </div>
      </section>

      {/* Commercials + follow-up */}
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Commercials & follow-up</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField name="seats" label="Seats (qty)" defaultValue={deal?.seats} />
          <NumberField name="acv" label="ACV / expected value" defaultValue={deal?.acv} placeholder="e.g. 36000" />
          <DateField name="opportunity_start" label="Opportunity start date" defaultValue={deal?.opportunity_start} />
          <DateField name="expected_close" label="Expected close" defaultValue={deal?.expected_close} />
          <TextField name="next_step" label="Next step" defaultValue={deal?.next_step} />
          <DateField name="next_step_date" label="Next-step date" defaultValue={deal?.next_step_date} />
        </div>
      </section>

      {/* Close reasons */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink">If closed</h2>
        <p className="mb-4 text-xs text-ink-muted">Fill the matching reason only when the deal is won or lost.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField name="closed_won_reason" label="Closed-won reason" options={options.closed_won_reason ?? []} defaultValue={deal?.closed_won_reason} />
          <SelectField name="closed_lost_reason" label="Closed-lost reason" options={options.closed_lost_reason ?? []} defaultValue={deal?.closed_lost_reason} />
        </div>
        <div className="mt-4">
          <TextArea name="notes" label="Notes" defaultValue={deal?.notes} rows={3} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton label={deal ? "Save changes" : "Create deal"} />
        <Link href={deal ? `/deals/${deal.id}` : "/deals"} className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
