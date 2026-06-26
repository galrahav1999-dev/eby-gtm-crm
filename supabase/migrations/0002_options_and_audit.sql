-- =====================================================================
-- EBY GTM CRM — editable dropdown options + audit log
--
-- WHY: EBY is in discovery; dropdown values change often. Storing them in a
-- table (not in code) lets the team add/rename/hide options from an admin
-- screen with no redeploy. The audit log records every create/edit/delete for
-- KPIs, activity views, and root-cause analysis.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIELD OPTIONS  (the editable source of every dropdown)
-- ---------------------------------------------------------------------
create table field_options (
  id         uuid primary key default gen_random_uuid(),
  field_key  text not null,            -- e.g. 'owner', 'segment', 'org_type'
  value      text not null,            -- the stored + displayed value
  sort_order integer not null default 0,
  active     boolean not null default true,  -- hide without deleting (keeps history valid)
  created_at timestamptz not null default now(),
  unique (field_key, value)
);
create index field_options_key_idx on field_options(field_key) where active;

insert into field_options (field_key, value, sort_order) values
  ('owner', 'Gal', 0),
  ('owner', 'Leah', 1),
  ('owner', 'Mashav', 2),
  ('owner', 'Michael', 3),
  ('org_type', 'Day school', 0),
  ('org_type', 'Supplementary / Hebrew school', 1),
  ('org_type', 'Kindergarten / preschool', 2),
  ('org_type', 'Synagogue', 3),
  ('org_type', 'JCC / community center', 4),
  ('org_type', 'Adult-ed program', 5),
  ('org_type', 'Ulpan / online program', 6),
  ('org_type', 'University Hillel/Chabad', 7),
  ('org_type', 'Youth movement / camp', 8),
  ('org_type', 'Other', 9),
  ('age_band', 'Preschool / kindergarten', 0),
  ('age_band', 'Elementary (K-5)', 1),
  ('age_band', 'Middle (6-8)', 2),
  ('age_band', 'High school (9-12)', 3),
  ('age_band', 'K-12 (full)', 4),
  ('age_band', 'Adult', 5),
  ('age_band', 'Mixed / all ages', 6),
  ('denomination', 'Secular / cultural', 0),
  ('denomination', 'Reform', 1),
  ('denomination', 'Conservative', 2),
  ('denomination', 'Modern Orthodox', 3),
  ('denomination', 'Haredi / Orthodox', 4),
  ('denomination', 'Community / pluralistic', 5),
  ('denomination', 'N/A (consumer)', 6),
  ('country', 'USA', 0),
  ('country', 'UK', 1),
  ('country', 'France', 2),
  ('country', 'Canada', 3),
  ('country', 'Argentina', 4),
  ('country', 'Australia', 5),
  ('country', 'Israel', 6),
  ('country', 'Other', 7),
  ('person_role', 'Principal / head of school', 0),
  ('person_role', 'Curriculum coordinator', 1),
  ('person_role', 'Hebrew teacher', 2),
  ('person_role', 'Program director', 3),
  ('person_role', 'Parent', 4),
  ('person_role', 'Student', 5),
  ('person_role', 'Partner contact', 6),
  ('person_role', 'Investor', 7),
  ('person_role', 'Consumer power-user', 8),
  ('person_role', 'Other', 9),
  ('lifecycle', 'Discovery', 0),
  ('lifecycle', 'Prospect', 1),
  ('lifecycle', 'Opportunity', 2),
  ('lifecycle', 'Customer', 3),
  ('lifecycle', 'Disqualified', 4),
  ('lifecycle', 'Dormant', 5),
  ('source', 'Excel / Birthright network', 0),
  ('source', 'Personal network', 1),
  ('source', 'LinkedIn outreach', 2),
  ('source', 'Referral / intro', 3),
  ('source', 'Inbound / waitlist', 4),
  ('source', 'Community event', 5),
  ('source', 'Cold outreach', 6),
  ('segment', 'B2B - non-Orthodox school', 0),
  ('segment', 'B2B - supplementary/community', 1),
  ('segment', 'B2B - synagogue/JCC', 2),
  ('segment', 'B2B - kindergarten', 3),
  ('segment', 'Partner - Ulpan', 4),
  ('segment', 'Partner - Birthright/Excel', 5),
  ('segment', 'B2C - Aliyah mover', 6),
  ('segment', 'B2C - olim in Ulpan', 7),
  ('segment', 'B2C - Israeli family/partner', 8),
  ('segment', 'B2C - identity reconnector', 9),
  ('segment', 'B2C - teacher self-buy', 10),
  ('org_status', 'To contact', 0),
  ('org_status', 'Outreach sent', 1),
  ('org_status', 'Replied', 2),
  ('org_status', 'Scheduled', 3),
  ('org_status', 'Interviewed', 4),
  ('org_status', 'Active', 5),
  ('org_status', 'No - dropped', 6),
  ('b2b_stage', '1 Discovery', 0),
  ('b2b_stage', '2 Qualified', 1),
  ('b2b_stage', '3 Demo/Validated', 2),
  ('b2b_stage', '4 Pilot/LOI', 3),
  ('b2b_stage', '5 Proposal', 4),
  ('b2b_stage', '6 Closed Won', 5),
  ('b2b_stage', '6 Closed Lost', 6),
  ('yes_no_unknown', 'Y', 0),
  ('yes_no_unknown', 'N', 1),
  ('yes_no_unknown', 'Unknown', 2),
  ('eval_timing', 'Now / this term', 0),
  ('eval_timing', 'Next term', 1),
  ('eval_timing', 'Next school year', 2),
  ('eval_timing', 'Budget cycle TBD', 3),
  ('eval_timing', 'No timeline', 4),
  ('decision_timeline', 'This term / immediate', 0),
  ('decision_timeline', 'Within 3 months', 1),
  ('decision_timeline', 'This budget cycle', 2),
  ('decision_timeline', 'Next budget cycle', 3),
  ('decision_timeline', 'Next school year', 4),
  ('decision_timeline', '6-12 months', 5),
  ('decision_timeline', 'Unknown', 6),
  ('closed_lost_reason', 'No budget', 0),
  ('closed_lost_reason', 'No urgency / weak pain', 1),
  ('closed_lost_reason', 'Wrong buyer / no authority', 2),
  ('closed_lost_reason', 'Chose competitor', 3),
  ('closed_lost_reason', 'Chose status quo', 4),
  ('closed_lost_reason', 'No Hebrew program at all', 5),
  ('closed_lost_reason', 'Bad timing', 6),
  ('closed_lost_reason', 'Unresponsive', 7),
  ('closed_won_reason', 'Strong pain + urgency', 0),
  ('closed_won_reason', 'Champion drove it', 1),
  ('closed_won_reason', 'Pilot proved ROI', 2),
  ('closed_won_reason', 'Budget available now', 3),
  ('closed_won_reason', 'Relationship / trust', 4),
  ('closed_won_reason', 'Better than incumbent', 5),
  ('priority', 'High', 0),
  ('priority', 'Medium', 1),
  ('priority', 'Low', 2),
  ('pilot_stage', 'Identified', 0),
  ('pilot_stage', 'Agreed (DPA)', 1),
  ('pilot_stage', 'Onboarding', 2),
  ('pilot_stage', 'Active', 3),
  ('pilot_stage', 'Converted', 4),
  ('pilot_stage', 'Churned', 5),
  ('urgency', 'High', 0),
  ('urgency', 'Medium', 1),
  ('urgency', 'Low', 2),
  ('feedback_cadence', 'Weekly', 0),
  ('feedback_cadence', 'Biweekly', 1),
  ('feedback_cadence', 'Monthly', 2),
  ('feedback_cadence', 'Ad hoc', 3),
  ('feedback_cadence', 'None yet', 4),
  ('partner_type', 'Reseller', 0),
  ('partner_type', 'Referral', 1),
  ('partner_type', 'Co-marketing', 2),
  ('partner_type', 'Distribution / list access', 3),
  ('partner_stage', 'Identified', 0),
  ('partner_stage', 'Pitched', 1),
  ('partner_stage', 'Agreement', 2),
  ('partner_stage', 'Enabled', 3),
  ('partner_stage', 'Productive', 4),
  ('partner_stage', 'Dropped', 5),
  ('interaction_type', 'Discovery interview', 0),
  ('interaction_type', 'Intro call', 1),
  ('interaction_type', 'Demo', 2),
  ('interaction_type', 'Pilot check-in', 3),
  ('interaction_type', 'Email', 4),
  ('interaction_type', 'Meeting', 5),
  ('interaction_type', 'Partner call', 6);

-- ---------------------------------------------------------------------
-- AUDIT LOG  (who did what; immutable)
-- ---------------------------------------------------------------------
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  actor_name  text,
  action      text not null,           -- create | update | delete
  table_name  text not null,
  record_id   uuid,
  display_id  text,
  summary     text,                    -- "Created organization Ashar"
  diff        jsonb,                   -- { field: { from, to } }
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on audit_log(created_at desc);
create index audit_log_table_idx on audit_log(table_name, record_id);

-- ---------------------------------------------------------------------
-- Row Level Security
--   field_options: any signed-in teammate can read + manage.
--   audit_log: any signed-in teammate can read + append; never edit/delete.
-- ---------------------------------------------------------------------
alter table field_options enable row level security;
create policy field_options_all on field_options
  for all to authenticated using (true) with check (true);

alter table audit_log enable row level security;
create policy audit_read on audit_log
  for select to authenticated using (true);
create policy audit_insert on audit_log
  for insert to authenticated with check (true);
