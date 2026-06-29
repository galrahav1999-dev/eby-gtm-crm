import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge } from "@/components/crm/ui";
import { DeleteButton } from "@/components/crm/DeleteButton";
import { addOption, toggleOption, deleteOption } from "./actions";

export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
  owner: "Owners (team)",
  org_type: "Organization type",
  age_band: "Age / grade band",
  denomination: "Denomination",
  country: "Country",
  person_role: "Person role / title",
  lifecycle: "Lifecycle",
  source: "Source",
  segment: "Segment",
  org_status: "Organization status",
  b2b_stage: "B2B deal stage",
  yes_no_unknown: "Yes / No / Unknown",
  eval_timing: "Eval start timing",
  decision_timeline: "Decision timeline",
  closed_lost_reason: "Closed-lost reason",
  closed_won_reason: "Closed-won reason",
  priority: "Priority",
  pilot_stage: "Pilot stage",
  urgency: "Urgency",
  feedback_cadence: "Feedback cadence",
  partner_type: "Partner type",
  partner_stage: "Partner stage",
  interaction_type: "Interaction type",
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("field_options")
    .select("id, field_key, value, active, sort_order")
    .order("field_key")
    .order("sort_order");

  const groups: Record<string, typeof data> = {};
  for (const row of data ?? []) (groups[row.field_key] ??= []).push(row);

  return (
    <div>
      <PageHeader
        title="Admin / lists"
        subtitle="Add, hide, or remove any dropdown value. Changes apply instantly across the app, no developer needed."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(groups).map(([key, opts]) => (
          <div key={key} className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {FIELD_LABELS[key] ?? key}{" "}
              <span className="font-mono text-[10px] text-ink-muted">{key}</span>
            </h2>

            <ul className="mb-3 space-y-1.5">
              {opts!.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <span className={o.active ? "" : "opacity-40"}>
                    <Badge value={o.value} />
                  </span>
                  <span className="flex items-center gap-1">
                    <form action={toggleOption.bind(null, o.id, !o.active)}>
                      <button type="submit" className="btn-ghost text-[11px]">
                        {o.active ? "Hide" : "Show"}
                      </button>
                    </form>
                    <DeleteButton
                      action={deleteOption.bind(null, o.id)}
                      label="✕"
                      confirmText="Remove value?"
                    />
                  </span>
                </li>
              ))}
            </ul>

            <form action={addOption.bind(null, key)} className="flex items-center gap-2">
              <input
                name="value"
                placeholder="Add a value…"
                className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary"
              />
              <button type="submit" className="btn-ghost shrink-0 text-xs">
                Add
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
