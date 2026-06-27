-- =====================================================================
-- EBY GTM CRM — seed data from the team's real "Discovery Contacts" tracker
-- (EBY_Pipeline_GTM.xlsx, tab "Discovery Contacts", 21 real contacts).
--
-- Faithfulness rules applied (same as the Mom-Test logger):
--  * Nothing invented. A field is filled only when the source clearly supports
--    it; otherwise it is left blank.
--  * Each person's ORIGINAL role description is preserved verbatim in `notes`,
--    so no wording is lost even when it did not map to a dropdown value.
--  * Dropdown fields (role, segment, country) are set only on clear matches.
--  * "Misha" is mapped to owner "Michael" (same person).
--  * Lifecycle = 'Discovery' for all (this is the discovery-sprint tracker).
--  * display_id (PER-/ORG-/INT-) is auto-generated on insert by the database.
--
-- Safe to re-run after a fresh migration. Run AFTER 0001_init.sql.
-- =====================================================================

-- Two organizations are explicitly named in the tracker.
insert into organizations (name, segment, notes) values
  ('Ashar', null, 'Jewish school; three staff contacts logged (principal, Hebrew teacher, curriculum coordinator).'),
  ('FIDI Chabad', null, 'Beit Chabad group Hebrew lessons. Org type left blank: "Chabad" did not map cleanly to a dropdown value.');

-- People (one row per real contact). org_id linked by name for Ashar staff.
insert into people (first_name, last_name, role_title, org_id, segment, country, city, owner, lifecycle, notes) values
  ('Kiara''s aunt', null, null, null, null, 'Argentina', null, 'Gal', 'Discovery',
   'Director of Jewish Teachers in Argentina. Call status: never met.'),
  ('Cindy', null, 'Hebrew teacher', null, 'B2B - synagogue/JCC', 'USA', 'CT', null, 'Discovery',
   'Hebrew teacher at JCC in CT.'),
  ('Koren', 'Levi', null, null, 'B2B - synagogue/JCC', null, null, null, 'Discovery',
   'Shlichut at JCC.'),
  ('Sasha', null, 'Hebrew teacher', null, null, 'USA', 'NYC', null, 'Discovery',
   'Hebrew teacher across several college campuses creating curriculum as Israeli Shaliach.'),
  ('Colton', 'Rahav', null, null, null, 'USA', 'Arizona', null, 'Discovery',
   'School Staffing Specialist. Program: High-Schools. Tagged B2B in tracker.'),
  ('Menucha', 'Kotlarsky', null, null, null, null, null, null, 'Discovery',
   'Daughter of principal of Jewish elementary school.'),
  ('Dan', 'Sommer', 'Consumer power-user', null, null, null, null, null, 'Discovery',
   'Elderly millionaire paying $1,000+ for a tutor to learn Hebrew every month.'),
  (null, null, 'Principal / head of school', (select id from organizations where name='Ashar'), null, null, null, null, 'Discovery',
   'Ashar Principal.'),
  (null, null, 'Hebrew teacher', (select id from organizations where name='Ashar'), null, null, null, null, 'Discovery',
   'Ashar Hebrew teacher.'),
  (null, null, 'Curriculum coordinator', (select id from organizations where name='Ashar'), null, null, null, null, 'Discovery',
   'Ashar curriculum coordinator.'),
  (null, null, null, null, 'Partner - Birthright/Excel', null, null, null, 'Discovery',
   'Director of fundraising for birthright American Jews & Israelis?'),
  (null, null, null, null, null, null, null, null, 'Discovery',
   'Language event organizer at Avraham hostel?'),
  (null, null, null, null, 'Partner - Ulpan', null, null, 'Mashav', 'Discovery',
   'In charge of Ulpan Israeli.'),
  ('Anastasia', null, null, null, null, null, null, null, 'Discovery',
   'Taught herself Hebrew.'),
  ('Randi', null, 'Parent', null, null, null, null, null, 'Discovery',
   'Parent paying for lessons for herself & her family.'),
  ('Itai, Mai', null, 'Hebrew teacher', null, null, null, null, null, 'Discovery',
   'Tutors that speak Hebrew teaching. (Two people in one tracker row; split later if needed.)'),
  ('Stefanie', null, null, null, 'B2C - Israeli family/partner', null, null, null, 'Discovery',
   'Israeli parents, can''t speak Hebrew well or read & write.'),
  ('Yasmin Ella', 'Grantt', null, null, null, 'UK', 'London', 'Gal', 'Discovery',
   'English mother, lived in Israel and taught herself Hebrew - still fluent and teaches her children in England.'),
  ('Felix', 'Rozen', null, null, 'B2C - Israeli family/partner', 'UK', 'London', 'Gal', 'Discovery',
   '28 years old, actively taking courses to learn Hebrew (citizen cafe), has an Israeli girlfriend.'),
  ('Joshua', 'Heinrich', null, null, null, 'Other', 'Munich', 'Michael', 'Discovery',
   'Interim head of PR at Israel consulate in Munich, has been trying to learn Hebrew by himself for many years. Country: Germany (Munich).');

-- Joshua's "Meeting Held" status becomes a logged interaction.
insert into interactions (person_id, type, owner, outcome)
select id, 'Meeting', 'Michael',
       'Meeting held (carried over from the old discovery tracker; details not recorded there).'
from people where last_name = 'Heinrich';
