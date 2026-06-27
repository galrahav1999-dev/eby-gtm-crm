import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logAudit } from "@/lib/audit";
import type { Proposal } from "./extract";

export interface IncludeSets {
  organizations: Set<number>;
  people: Set<number>;
  interactions: Set<number>;
  deals: Set<number>;
}

export interface CommitResult {
  organizations: string[];
  people: string[];
  interactions: string[];
  deals: string[];
}

const clean = (v: unknown) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

/**
 * Turn a reviewed proposal into real, linked records.
 * - De-dupes organizations by name and people by email/full-name against the DB.
 * - Resolves links by the name references the AI produced.
 * - Interactions are appended (never overwrite).
 */
export async function commitProposal(
  supabase: SupabaseClient,
  proposal: Proposal,
  include: IncludeSets
): Promise<CommitResult> {
  const result: CommitResult = { organizations: [], people: [], interactions: [], deals: [] };

  // name (lowercased) -> org id
  const orgByName = new Map<string, string>();
  async function resolveOrg(name: string | null): Promise<string | null> {
    const n = clean(name);
    if (!n) return null;
    const key = n.toLowerCase();
    if (orgByName.has(key)) return orgByName.get(key)!;
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .ilike("name", n)
      .limit(1)
      .maybeSingle();
    if (existing) {
      orgByName.set(key, existing.id);
      return existing.id;
    }
    return null;
  }

  // 1) Organizations (included only)
  for (let i = 0; i < proposal.organizations.length; i++) {
    if (!include.organizations.has(i)) continue;
    const o = proposal.organizations[i];
    const name = clean(o.name);
    if (!name) continue;
    let id = await resolveOrg(name);
    if (!id) {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name,
          org_type: clean(o.org_type),
          age_band: clean(o.age_band),
          denomination: clean(o.denomination),
          city: clean(o.city),
          country: clean(o.country),
          size: clean(o.size),
          affiliation: clean(o.affiliation),
          segment: clean(o.segment),
          status: clean(o.status),
          notes: clean(o.notes),
        })
        .select("id, display_id, name")
        .single();
      if (error) throw new Error(`Org "${name}": ${error.message}`);
      id = data.id;
      result.organizations.push(data.id);
      await logAudit(supabase, { action: "create", table: "organizations", recordId: data.id, displayId: data.display_id, summary: `AI logger created organization ${data.name}` });
    }
    orgByName.set(name.toLowerCase(), id!);
  }

  // person full-name (lowercased) -> id
  const personByName = new Map<string, string>();
  async function resolvePerson(name: string | null): Promise<string | null> {
    const n = clean(name);
    if (!n) return null;
    return personByName.get(n.toLowerCase()) ?? null;
  }

  // 2) People (included only)
  for (let i = 0; i < proposal.people.length; i++) {
    if (!include.people.has(i)) continue;
    const p = proposal.people[i];
    const first = clean(p.first_name);
    const last = clean(p.last_name);
    const email = clean(p.email);
    const fullName = [first, last].filter(Boolean).join(" ") || email || null;

    // dedupe: by email, else by exact full name
    let existingId: string | null = null;
    if (email) {
      const { data } = await supabase.from("people").select("id").ilike("email", email).limit(1).maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId && first) {
      const { data } = await supabase
        .from("people")
        .select("id")
        .ilike("first_name", first)
        .ilike("last_name", last ?? "")
        .limit(1)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      if (fullName) personByName.set(fullName.toLowerCase(), existingId);
      continue;
    }

    const org_id = await resolveOrg(p.org_name);
    const { data, error } = await supabase
      .from("people")
      .insert({
        first_name: first,
        last_name: last,
        email,
        role_title: clean(p.role_title),
        org_id,
        city: clean(p.city),
        country: clean(p.country),
        segment: clean(p.segment),
        source: clean(p.source),
        lifecycle: clean(p.lifecycle),
        owner: clean(p.owner),
        next_step: clean(p.next_step),
        next_step_date: clean(p.next_step_date),
        notes: clean(p.notes),
      })
      .select("id, display_id")
      .single();
    if (error) throw new Error(`Person "${fullName}": ${error.message}`);
    result.people.push(data.id);
    if (fullName) personByName.set(fullName.toLowerCase(), data.id);
    await logAudit(supabase, { action: "create", table: "people", recordId: data.id, displayId: data.display_id, summary: `AI logger created person ${fullName ?? data.display_id}` });
  }

  // 3) Deals (included only)
  const dealByOrg = new Map<string, string>();
  for (let i = 0; i < proposal.deals.length; i++) {
    if (!include.deals.has(i)) continue;
    const d = proposal.deals[i];
    const name = clean(d.name);
    if (!name) continue;
    const org_id = await resolveOrg(d.org_name);
    const { data, error } = await supabase
      .from("deals")
      .insert({
        name,
        org_id,
        stage: clean(d.stage),
        priority: clean(d.priority),
        has_hebrew: clean(d.has_hebrew),
        current_solution: clean(d.current_solution),
        current_state: clean(d.current_state),
        pains: clean(d.pains),
        ideal_state: clean(d.ideal_state),
        eval_timing: clean(d.eval_timing),
        decision_timeline: clean(d.decision_timeline),
        owner: clean(d.owner),
        notes: clean(d.notes),
      })
      .select("id, display_id, name")
      .single();
    if (error) throw new Error(`Deal "${name}": ${error.message}`);
    result.deals.push(data.id);
    if (org_id) dealByOrg.set(org_id, data.id);
    await logAudit(supabase, { action: "create", table: "deals", recordId: data.id, displayId: data.display_id, summary: `AI logger created deal ${data.name}` });
  }

  // 4) Interactions (included only; always appended)
  for (let i = 0; i < proposal.interactions.length; i++) {
    if (!include.interactions.has(i)) continue;
    const it = proposal.interactions[i];
    const person_id = await resolvePerson(it.person_name);
    const org_id = await resolveOrg(it.org_name);
    const deal_id = org_id ? dealByOrg.get(org_id) ?? null : null;
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        date: clean(it.date),
        person_id,
        org_id,
        deal_id,
        type: clean(it.type),
        owner: clean(it.owner),
        outcome: clean(it.outcome),
        verbatim_quote: clean(it.verbatim_quote),
        next_step: clean(it.next_step),
        next_step_date: clean(it.next_step_date),
      })
      .select("id, display_id")
      .single();
    if (error) throw new Error(`Interaction: ${error.message}`);
    result.interactions.push(data.id);
    await logAudit(supabase, { action: "create", table: "interactions", recordId: data.id, displayId: data.display_id, summary: `AI logger logged interaction ${data.display_id}` });
  }

  return result;
}
