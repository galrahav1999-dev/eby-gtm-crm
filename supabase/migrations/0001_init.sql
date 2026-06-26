-- =====================================================================
-- EBY GTM CRM — initial schema
-- 7 objects from docs/EBY-CRM-Handoff.md (section 6), linked by ID.
--
-- Design choices (plain-English in docs/EBY-CRM-Handoff.md / SETUP.md):
--  * Each row has an internal uuid `id` (the real primary key) AND a
--    human-facing `display_id` like PER-0000001, kept for continuity and a
--    clean HubSpot migration later. display_id is auto-assigned on insert.
--  * Dropdown fields are plain text; validity is enforced by the app
--    (lib/enums.ts is the single source of truth). Adding a new dropdown
--    value later needs no database change.
--  * Links between records (foreign keys) ARE enforced by the database.
--  * Row Level Security: any signed-in team member can read/write everything
--    (this is a shared internal CRM). Login is invite-only (set in Supabase).
-- =====================================================================

-- Auto-update an updated_at column on every UPDATE.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Build a zero-padded display id like PER-0000001 from a sequence.
create or replace function assign_display_id()
returns trigger language plpgsql as $$
declare
  prefix text := tg_argv[0];
  seq    text := tg_argv[1];
begin
  if new.display_id is null or new.display_id = '' then
    new.display_id := prefix || '-' || lpad(nextval(seq)::text, 7, '0');
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- ORGANIZATIONS  (= HubSpot Companies, dedupe key = domain)
-- ---------------------------------------------------------------------
create sequence if not exists org_display_seq;
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  display_id    text unique,
  name          text not null,
  domain        text,
  org_type      text,
  age_band      text,
  denomination  text,
  city          text,
  country       text,
  size          text,                 -- "students / seats", kept free-text (sheet uses "n/a" etc.)
  affiliation   text,
  segment       text,
  owner         text,
  status        text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger org_display before insert on organizations
  for each row execute function assign_display_id('ORG', 'org_display_seq');
create trigger org_touch before update on organizations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- PEOPLE  (= HubSpot Contacts, dedupe key = email)
-- ---------------------------------------------------------------------
create sequence if not exists person_display_seq;
create table people (
  id             uuid primary key default gen_random_uuid(),
  display_id     text unique,
  first_name     text,
  last_name      text,
  email          text,
  role_title     text,
  org_id         uuid references organizations(id) on delete set null,
  -- country/city added beyond the original sheet: individual B2C learners often
  -- have a location but no organization to carry it. Optional.
  country        text,
  city           text,
  segment        text,
  source         text,
  lifecycle      text,
  owner          text,
  next_step      text,
  next_step_date date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger person_display before insert on people
  for each row execute function assign_display_id('PER', 'person_display_seq');
create trigger person_touch before update on people
  for each row execute function set_updated_at();
create index people_org_idx on people(org_id);

-- ---------------------------------------------------------------------
-- B2B DEALS  (= HubSpot Deals)
-- ---------------------------------------------------------------------
create sequence if not exists deal_display_seq;
create table deals (
  id                   uuid primary key default gen_random_uuid(),
  display_id           text unique,
  name                 text not null,
  org_id               uuid references organizations(id) on delete set null,
  economic_buyer_id    uuid references people(id) on delete set null,
  poc_id               uuid references people(id) on delete set null,   -- point of contact
  champion_id          uuid references people(id) on delete set null,
  stage                text,
  priority             text,
  has_hebrew           text,                 -- Y / N / Unknown
  current_solution     text,
  current_state        text,
  pains                text,                 -- their words (verbatim)
  ideal_state          text,
  eval_timing          text,
  decision_timeline    text,
  seats                integer,
  acv                  numeric,              -- expected annual value
  opportunity_start    date,
  expected_close       date,
  owner                text,
  next_step            text,
  next_step_date       date,
  closed_won_reason    text,
  closed_lost_reason   text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger deal_display before insert on deals
  for each row execute function assign_display_id('DL', 'deal_display_seq');
create trigger deal_touch before update on deals
  for each row execute function set_updated_at();
create index deals_org_idx on deals(org_id);

-- ---------------------------------------------------------------------
-- PILOTS / DESIGN PARTNERS
-- ---------------------------------------------------------------------
create sequence if not exists pilot_display_seq;
create table pilots (
  id                 uuid primary key default gen_random_uuid(),
  display_id         text unique,
  org_id             uuid references organizations(id) on delete set null,
  champion_id        uuid references people(id) on delete set null,
  stage              text,
  urgency            text,
  capability         text,
  representativeness text,
  success_metric     text,
  feedback_cadence   text,
  dpa_signed         text,                   -- Y / N / Unknown
  convert_by         date,
  owner              text,
  next_step          text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger pilot_display before insert on pilots
  for each row execute function assign_display_id('PLT', 'pilot_display_seq');
create trigger pilot_touch before update on pilots
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- PARTNERS / CHANNEL
-- ---------------------------------------------------------------------
create sequence if not exists partner_display_seq;
create table partners (
  id                 uuid primary key default gen_random_uuid(),
  display_id         text unique,
  partner_org        text not null,
  partner_type       text,
  primary_contact_id uuid references people(id) on delete set null,
  stage              text,
  what_they_give     text,
  expected_reach     text,
  terms              text,
  owner              text,
  next_step          text,
  next_step_date     date,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger partner_display before insert on partners
  for each row execute function assign_display_id('PTR', 'partner_display_seq');
create trigger partner_touch before update on partners
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- INTERACTIONS  (append-only activity log)
-- ---------------------------------------------------------------------
create sequence if not exists interaction_display_seq;
create table interactions (
  id             uuid primary key default gen_random_uuid(),
  display_id     text unique,
  date           date,
  person_id      uuid references people(id) on delete set null,
  org_id         uuid references organizations(id) on delete set null,
  deal_id        uuid references deals(id) on delete set null,
  type           text,
  owner          text,
  outcome        text,                   -- what happened / outcome
  verbatim_quote text,                   -- the Mom-Test signal, in their words
  next_step      text,
  next_step_date date,
  created_at     timestamptz not null default now()
);
create trigger interaction_display before insert on interactions
  for each row execute function assign_display_id('INT', 'interaction_display_seq');
create index interactions_person_idx on interactions(person_id);
create index interactions_org_idx on interactions(org_id);
create index interactions_deal_idx on interactions(deal_id);

-- ---------------------------------------------------------------------
-- B2C WAITLIST  (cohort aggregates, NOT one row per person)
-- ---------------------------------------------------------------------
create sequence if not exists cohort_display_seq;
create table waitlist_cohorts (
  id           uuid primary key default gen_random_uuid(),
  display_id   text unique,
  cohort_label text not null,          -- "2026-05 Inbound"
  segment      text,
  signups      integer default 0,
  confirmed    integer default 0,
  activated    integer default 0,
  retained_d30 integer default 0,
  paid         integer default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger cohort_display before insert on waitlist_cohorts
  for each row execute function assign_display_id('WL', 'cohort_display_seq');
create trigger cohort_touch before update on waitlist_cohorts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security: any authenticated team member can do everything.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','people','deals','pilots','partners',
    'interactions','waitlist_cohorts'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy team_all on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;
