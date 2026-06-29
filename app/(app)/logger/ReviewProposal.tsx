"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proposal } from "@/lib/ai/extract";
import type { OptionsMap } from "@/lib/options";
import { commitEdited } from "./actions";

type Kind = "text" | "textarea" | "select";
interface FieldCfg {
  name: string;
  label: string;
  kind: Kind;
  optionKey?: string;
}

const ORG: FieldCfg[] = [
  { name: "name", label: "Organization name", kind: "text" },
  { name: "org_type", label: "Org type", kind: "select", optionKey: "org_type" },
  { name: "segment", label: "Segment", kind: "select", optionKey: "segment" },
  { name: "age_band", label: "Age / grade band", kind: "select", optionKey: "age_band" },
  { name: "denomination", label: "Denomination", kind: "select", optionKey: "denomination" },
  { name: "city", label: "City", kind: "text" },
  { name: "country", label: "Country", kind: "select", optionKey: "country" },
  { name: "size", label: "Size", kind: "text" },
  { name: "affiliation", label: "Affiliation", kind: "text" },
  { name: "status", label: "Status", kind: "select", optionKey: "org_status" },
  { name: "notes", label: "Notes", kind: "textarea" },
];

const PERSON: FieldCfg[] = [
  { name: "first_name", label: "First name", kind: "text" },
  { name: "last_name", label: "Last name", kind: "text" },
  { name: "email", label: "Email", kind: "text" },
  { name: "role_title", label: "Role / title", kind: "select", optionKey: "person_role" },
  { name: "org_name", label: "Organization (by name)", kind: "text" },
  { name: "segment", label: "Segment", kind: "select", optionKey: "segment" },
  { name: "city", label: "City", kind: "text" },
  { name: "country", label: "Country", kind: "select", optionKey: "country" },
  { name: "source", label: "Source", kind: "select", optionKey: "source" },
  { name: "lifecycle", label: "Lifecycle", kind: "select", optionKey: "lifecycle" },
  { name: "owner", label: "Owner", kind: "select", optionKey: "owner" },
  { name: "next_step", label: "Next step", kind: "text" },
  { name: "next_step_date", label: "Next-step date", kind: "text" },
  { name: "notes", label: "Notes", kind: "textarea" },
];

const DEAL: FieldCfg[] = [
  { name: "name", label: "Deal name", kind: "text" },
  { name: "org_name", label: "Organization (by name)", kind: "text" },
  { name: "stage", label: "Stage", kind: "select", optionKey: "b2b_stage" },
  { name: "priority", label: "Priority", kind: "select", optionKey: "priority" },
  { name: "has_hebrew", label: "Has Hebrew program today?", kind: "select", optionKey: "yes_no_unknown" },
  { name: "current_solution", label: "Tools / current solution", kind: "text" },
  { name: "current_state", label: "Current state", kind: "textarea" },
  { name: "pains", label: "Pains (verbatim)", kind: "textarea" },
  { name: "ideal_state", label: "Ideal state", kind: "textarea" },
  { name: "eval_timing", label: "Eval timing", kind: "select", optionKey: "eval_timing" },
  { name: "decision_timeline", label: "Decision timeline", kind: "select", optionKey: "decision_timeline" },
  { name: "owner", label: "Owner", kind: "select", optionKey: "owner" },
  { name: "notes", label: "Notes", kind: "textarea" },
];

const INTERACTION: FieldCfg[] = [
  { name: "date", label: "Date", kind: "text" },
  { name: "person_name", label: "Person (by name)", kind: "text" },
  { name: "org_name", label: "Organization (by name)", kind: "text" },
  { name: "type", label: "Type", kind: "select", optionKey: "interaction_type" },
  { name: "owner", label: "Owner", kind: "select", optionKey: "owner" },
  { name: "outcome", label: "Outcome", kind: "textarea" },
  { name: "verbatim_quote", label: "Verbatim quote", kind: "textarea" },
  { name: "next_step", label: "Next step", kind: "text" },
  { name: "next_step_date", label: "Next-step date", kind: "text" },
];

const fieldBase =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary";

export function ReviewProposal({
  id,
  proposal,
  options,
}: {
  id: string;
  proposal: Proposal;
  options: OptionsMap;
}) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<any[]>(proposal.organizations.map((o) => ({ ...o })));
  const [people, setPeople] = useState<any[]>(proposal.people.map((o) => ({ ...o })));
  const [deals, setDeals] = useState<any[]>(proposal.deals.map((o) => ({ ...o })));
  const [interactions, setInteractions] = useState<any[]>(proposal.interactions.map((o) => ({ ...o })));
  const [incOrg, setIncOrg] = useState<boolean[]>(proposal.organizations.map(() => true));
  const [incPerson, setIncPerson] = useState<boolean[]>(proposal.people.map(() => true));
  const [incDeal, setIncDeal] = useState<boolean[]>(proposal.deals.map(() => true));
  const [incInt, setIncInt] = useState<boolean[]>(proposal.interactions.map(() => true));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function control(cfg: FieldCfg, value: any, onChange: (v: string | null) => void) {
    const v = value ?? "";
    if (cfg.kind === "select") {
      const opts = options[cfg.optionKey!] ?? [];
      const list = v && !opts.includes(v) ? [v, ...opts] : opts;
      return (
        <select className={`${fieldBase} appearance-none`} value={v} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {list.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (cfg.kind === "textarea") {
      return <textarea className={`${fieldBase} resize-y`} rows={2} value={v} onChange={(e) => onChange(e.target.value || null)} />;
    }
    return <input className={fieldBase} value={v} onChange={(e) => onChange(e.target.value || null)} />;
  }

  function Section({
    title,
    table,
    items,
    setItems,
    cfg,
    inc,
    setInc,
    singular,
  }: {
    title: string;
    table: string;
    items: any[];
    setItems: (fn: (p: any[]) => any[]) => void;
    cfg: FieldCfg[];
    inc: boolean[];
    setInc: (fn: (p: boolean[]) => boolean[]) => void;
    singular: string;
  }) {
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-ink">
          {title} <span className="text-ink-muted">({items.length})</span>
          <span className="font-mono text-[10px] text-ink-muted">to {table}</span>
        </h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`card p-4 transition ${inc[i] ? "" : "opacity-50"}`}>
              <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={inc[i]}
                  onChange={() => setInc((p) => p.map((b, idx) => (idx === i ? !b : b)))}
                  className="accent-[var(--primary)]"
                />
                Include this {singular}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {cfg.map((f) => (
                  <div key={f.name} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                    <label className="mb-1 flex items-baseline gap-1.5 text-xs font-medium text-ink-soft">
                      {f.label}
                      <span className="font-mono text-[10px] text-ink-muted">{f.name}</span>
                    </label>
                    {control(f, item[f.name], (v) =>
                      setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [f.name]: v } : it)))
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const include = {
      organizations: orgs.map((_, i) => i).filter((i) => incOrg[i]),
      people: people.map((_, i) => i).filter((i) => incPerson[i]),
      deals: deals.map((_, i) => i).filter((i) => incDeal[i]),
      interactions: interactions.map((_, i) => i).filter((i) => incInt[i]),
    };
    if (
      include.organizations.length + include.people.length + include.deals.length + include.interactions.length ===
      0
    ) {
      setErr("Nothing is ticked to save. Include at least one record, or cancel.");
      setBusy(false);
      return;
    }
    try {
      const edited: Proposal = {
        organizations: orgs,
        people,
        deals,
        interactions,
        to_chase_next: proposal.to_chase_next ?? [],
      };
      await commitEdited(id, edited, include);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl px-4 py-3 text-sm text-ink-soft"
        style={{ background: "color-mix(in srgb, var(--primary) 9%, transparent)" }}
      >
        Review every field below. Edit any text, change any dropdown, and untick anything you do not want.
        Nothing is saved until you press Accept and save.
      </div>

      <Section title="Organizations" table="organizations" items={orgs} setItems={setOrgs} cfg={ORG} inc={incOrg} setInc={setIncOrg} singular="organization" />
      <Section title="People" table="people" items={people} setItems={setPeople} cfg={PERSON} inc={incPerson} setInc={setIncPerson} singular="person" />
      <Section title="Deals" table="deals" items={deals} setItems={setDeals} cfg={DEAL} inc={incDeal} setInc={setIncDeal} singular="deal" />
      <Section title="Interactions" table="interactions" items={interactions} setItems={setInteractions} cfg={INTERACTION} inc={incInt} setInc={setIncInt} singular="interaction" />

      {err && (
        <p className="rounded-lg px-3 py-2 text-sm text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {err}
        </p>
      )}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-card">
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy && (
            <svg viewBox="0 0 24 24" fill="none" className="mr-1.5 h-4 w-4 animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {busy ? "Saving…" : "Accept and save"}
        </button>
        <Link href="/logger" className="btn-ghost">
          Cancel
        </Link>
        <span className="text-xs text-ink-muted">Only ticked records are written.</span>
      </div>
    </div>
  );
}
