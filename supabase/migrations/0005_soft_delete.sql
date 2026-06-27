-- =====================================================================
-- EBY GTM CRM — soft delete
--
-- Records are archived (archived_at set), not hard-deleted, so nothing is ever
-- truly lost and an accidental delete can be restored. All list views filter to
-- archived_at IS NULL by default.
-- =====================================================================

alter table organizations   add column if not exists archived_at timestamptz;
alter table people          add column if not exists archived_at timestamptz;
alter table deals           add column if not exists archived_at timestamptz;
alter table pilots          add column if not exists archived_at timestamptz;
alter table partners        add column if not exists archived_at timestamptz;
alter table interactions    add column if not exists archived_at timestamptz;
alter table waitlist_cohorts add column if not exists archived_at timestamptz;

create index if not exists organizations_active_idx on organizations(archived_at) where archived_at is null;
create index if not exists people_active_idx on people(archived_at) where archived_at is null;
create index if not exists deals_active_idx on deals(archived_at) where archived_at is null;
