/**
 * Row shapes for each CRM table. These mirror supabase/migrations/0001_init.sql.
 * Dropdown columns are typed as strings (validated against lib/enums.ts in the
 * app) so adding a new option never requires a type change here.
 */

export interface Organization {
  id: string;
  display_id: string;
  name: string;
  domain: string | null;
  org_type: string | null;
  age_band: string | null;
  denomination: string | null;
  city: string | null;
  country: string | null;
  size: string | null;
  affiliation: string | null;
  segment: string | null;
  owner: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  display_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_title: string | null;
  org_id: string | null;
  country: string | null;
  city: string | null;
  segment: string | null;
  source: string | null;
  lifecycle: string | null;
  owner: string | null;
  next_step: string | null;
  next_step_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  display_id: string;
  name: string;
  org_id: string | null;
  economic_buyer_id: string | null;
  poc_id: string | null;
  champion_id: string | null;
  stage: string | null;
  priority: string | null;
  has_hebrew: string | null;
  current_solution: string | null;
  current_state: string | null;
  pains: string | null;
  ideal_state: string | null;
  eval_timing: string | null;
  decision_timeline: string | null;
  seats: number | null;
  acv: number | null;
  opportunity_start: string | null;
  expected_close: string | null;
  owner: string | null;
  next_step: string | null;
  next_step_date: string | null;
  closed_won_reason: string | null;
  closed_lost_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pilot {
  id: string;
  display_id: string;
  org_id: string | null;
  champion_id: string | null;
  stage: string | null;
  urgency: string | null;
  capability: string | null;
  representativeness: string | null;
  success_metric: string | null;
  feedback_cadence: string | null;
  dpa_signed: string | null;
  convert_by: string | null;
  owner: string | null;
  next_step: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  display_id: string;
  partner_org: string;
  partner_type: string | null;
  primary_contact_id: string | null;
  stage: string | null;
  what_they_give: string | null;
  expected_reach: string | null;
  terms: string | null;
  owner: string | null;
  next_step: string | null;
  next_step_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  display_id: string;
  date: string | null;
  person_id: string | null;
  org_id: string | null;
  deal_id: string | null;
  type: string | null;
  owner: string | null;
  outcome: string | null;
  verbatim_quote: string | null;
  next_step: string | null;
  next_step_date: string | null;
  created_at: string;
}

export interface WaitlistCohort {
  id: string;
  display_id: string;
  cohort_label: string;
  segment: string | null;
  signups: number;
  confirmed: number;
  activated: number;
  retained_d30: number;
  paid: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
