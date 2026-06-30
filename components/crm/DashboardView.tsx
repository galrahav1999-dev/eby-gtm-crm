"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { B2B_STAGES } from "@/lib/enums";
import { ownerColor } from "@/lib/colors";
import { isOverdue } from "@/lib/format";
import { OwnerAvatar, HelpTip } from "./ui";

export interface DealRow {
  stage: string | null;
  owner: string | null;
  acv: number | null;
  next_step_date: string | null;
}
export interface OwnedDated {
  owner: string | null;
  next_step_date: string | null;
}
export interface OwnedTyped {
  owner: string | null;
  type: string | null;
}
export interface CohortRow {
  cohort_label: string | null;
  signups: number | null;
  confirmed: number | null;
  activated: number | null;
  retained_d30: number | null;
  paid: number | null;
}

export interface DashboardData {
  deals: DealRow[];
  people: OwnedDated[];
  orgs: { owner: string | null }[];
  interactions: OwnedTyped[];
  pilots: { owner: string | null }[];
  partners: { owner: string | null }[];
  cohorts: CohortRow[];
}

// The five progression stages, then the two outcomes, drawn from the live enum.
const FLOW = B2B_STAGES.filter((s) => !/closed/i.test(s));
const WON = B2B_STAGES.find((s) => /won/i.test(s)) ?? "6 Closed Won";
const LOST = B2B_STAGES.find((s) => /lost/i.test(s)) ?? "6 Closed Lost";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const n0 = (v: number | null | undefined) => (typeof v === "number" && isFinite(v) ? v : 0);

export function DashboardView({ data }: { data: DashboardData }) {
  const [scope, setScope] = useState<string>("all");

  // Owners that actually appear anywhere, in a stable order.
  const owners = useMemo(() => {
    const set = new Set<string>();
    for (const r of [...data.deals, ...data.people, ...data.orgs, ...data.interactions, ...data.pilots, ...data.partners]) {
      if (r.owner) set.add(r.owner);
    }
    return [...set].sort();
  }, [data]);

  const inScope = <T extends { owner: string | null }>(rows: T[]) =>
    scope === "all" ? rows : rows.filter((r) => r.owner === scope);

  const deals = inScope(data.deals);
  const people = inScope(data.people);
  const orgs = inScope(data.orgs);
  const interactions = inScope(data.interactions);
  const pilots = inScope(data.pilots);
  const partners = inScope(data.partners);

  const interviews = interactions.filter((r) => r.type === "Discovery interview").length;
  const openDeals = deals.filter((d) => !/closed/i.test(d.stage ?? "")).length;
  const overdue =
    people.filter((p) => isOverdue(p.next_step_date)).length +
    deals.filter((d) => isOverdue(d.next_step_date)).length;

  // B2B funnel: how many deals sit at each progression stage, plus the outcomes.
  const byStage = useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    for (const s of [...FLOW, WON, LOST]) m.set(s, { count: 0, value: 0 });
    for (const d of deals) {
      const key = d.stage && m.has(d.stage) ? d.stage : null;
      if (!key) continue;
      const e = m.get(key)!;
      e.count += 1;
      e.value += n0(d.acv);
    }
    return m;
  }, [deals]);

  const flowMax = Math.max(1, ...FLOW.map((s) => byStage.get(s)?.count ?? 0));

  // B2C waitlist funnel: team-wide cohort sums (B2C has no owner).
  const b2c = useMemo(() => {
    const t = { signups: 0, confirmed: 0, activated: 0, retained_d30: 0, paid: 0 };
    for (const c of data.cohorts) {
      t.signups += n0(c.signups);
      t.confirmed += n0(c.confirmed);
      t.activated += n0(c.activated);
      t.retained_d30 += n0(c.retained_d30);
      t.paid += n0(c.paid);
    }
    return t;
  }, [data.cohorts]);

  const b2cSteps = [
    { label: "Signups", value: b2c.signups },
    { label: "Confirmed", value: b2c.confirmed },
    { label: "Activated", value: b2c.activated },
    { label: "Retained (D30)", value: b2c.retained_d30, help: "Still active at 30 days." },
    { label: "Paid", value: b2c.paid },
  ];

  const tiles = [
    { label: "Discovery interviews", value: interviews, sub: "of 25 sprint goal", href: "/interactions", accent: true },
    { label: "People", value: people.length, sub: "contacts", href: "/people" },
    { label: "Organizations", value: orgs.length, sub: "schools and orgs", href: "/organizations" },
    { label: "Open deals", value: openDeals, sub: "not closed", href: "/deals" },
    { label: "Pilots", value: pilots.length, sub: "design partners", href: "/pilots" },
    { label: "Partners", value: partners.length, sub: "channel", href: "/partners" },
    { label: "Overdue follow-ups", value: overdue, sub: "past due", href: "/people", warn: overdue > 0 },
  ];

  const scopeLabel = scope === "all" ? "Whole team" : scope;

  return (
    <div>
      {/* Scope filter: numbers recompute as you pick an owner. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="label-eyebrow mr-1">Showing</span>
        <button
          onClick={() => setScope("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            scope === "all" ? "bg-primary text-primary-contrast" : "border border-line bg-card text-ink-soft hover:text-ink"
          }`}
        >
          Whole team
        </button>
        {owners.map((o) => {
          const on = scope === o;
          return (
            <button
              key={o}
              onClick={() => setScope(on ? "all" : o)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                on ? "text-primary-contrast" : "border border-line bg-card text-ink-soft hover:text-ink"
              }`}
              style={on ? { background: ownerColor(o) } : undefined}
            >
              <OwnerAvatar owner={o} size={18} />
              {o}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-ink-muted">Scope: {scopeLabel}</span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            {s.accent && <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary-soft blur-xl" />}
            <div className="label-eyebrow">{s.label}</div>
            <div className={`mt-2 text-4xl font-semibold tracking-tight ${s.warn ? "text-danger" : "text-ink"}`}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-ink-muted">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* B2B deal funnel */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-eyebrow">B2B deal funnel</span>
            <span className="text-xs text-ink-muted">{scopeLabel}</span>
          </div>
          {deals.length === 0 ? (
            <p className="py-6 text-sm text-ink-muted">
              No deals yet. Start one from an organization or the AI logger.
            </p>
          ) : (
            <div className="space-y-2.5">
              {FLOW.map((stage, i) => {
                const e = byStage.get(stage)!;
                const prev = i > 0 ? byStage.get(FLOW[i - 1])!.count : null;
                const width = Math.max(4, (e.count / flowMax) * 100);
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-medium text-ink-soft">{stage}</span>
                      <span className="text-ink-muted">
                        {e.count} {e.count === 1 ? "deal" : "deals"}
                        {e.value > 0 && <span className="ml-2 text-ink-soft">{money(e.value)}</span>}
                        {prev != null && prev > 0 && (
                          <span className="ml-2" title="Share of the previous stage">
                            {pct(e.count, prev)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: "Closed won", s: WON, good: true },
                  { label: "Closed lost", s: LOST, good: false },
                ].map(({ label, s, good }) => {
                  const e = byStage.get(s)!;
                  return (
                    <div
                      key={s}
                      className="rounded-xl border border-line bg-surface-muted p-3"
                      style={{ borderLeftWidth: 3, borderLeftColor: good ? "var(--growth)" : "var(--danger)" }}
                    >
                      <div className="label-eyebrow">{label}</div>
                      <div className="mt-0.5 text-lg font-semibold text-ink">{e.count}</div>
                      {e.value > 0 && <div className="text-xs text-ink-muted">{money(e.value)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* B2C waitlist funnel */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-eyebrow">B2C waitlist funnel</span>
            <span className="inline-flex items-center text-xs text-ink-muted">
              Team-wide
              <HelpTip text="B2C is tracked as cohort totals, not per-person. Owner scope does not apply here." />
            </span>
          </div>
          {b2c.signups === 0 ? (
            <p className="py-6 text-sm text-ink-muted">No cohorts yet. Add one under B2C waitlist.</p>
          ) : (
            <>
              <div className="space-y-2.5">
                {b2cSteps.map((step, i) => {
                  const prev = i > 0 ? b2cSteps[i - 1].value : null;
                  const width = Math.max(4, pct(step.value, b2c.signups));
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                        <span className="inline-flex items-center font-medium text-ink-soft">
                          {step.label}
                          {step.help && <HelpTip text={step.help} />}
                        </span>
                        <span className="text-ink-muted">
                          {step.value}
                          {prev != null && prev > 0 && (
                            <span className="ml-2" title="Share of the previous step">
                              {pct(step.value, prev)}%
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: "var(--growth)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surface-muted p-3">
                  <div className="label-eyebrow">Confirm rate</div>
                  <div className="mt-0.5 text-lg font-semibold text-ink">{pct(b2c.confirmed, b2c.signups)}%</div>
                  <div className="text-xs text-ink-muted">confirmed of signups</div>
                </div>
                <div className="rounded-xl border border-line bg-surface-muted p-3">
                  <div className="label-eyebrow">Signup to paid</div>
                  <div className="mt-0.5 text-lg font-semibold text-ink">{pct(b2c.paid, b2c.signups)}%</div>
                  <div className="text-xs text-ink-muted">paid of signups</div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
