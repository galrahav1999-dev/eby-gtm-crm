/**
 * EBY GTM CRM — canonical dropdown values (single source of truth).
 *
 * These mirror the "Lists" tab of the original Google Sheet / Excel CRM and the
 * schema in docs/EBY-CRM-Handoff.md (section 4). The app validates every select
 * against these lists, so adding a new option later is a one-line change here
 * (no database migration needed). Order is the order shown in dropdowns.
 *
 * NOTE: "Ben" was removed from OWNERS — he is no longer on the team.
 */

export const OWNERS = ["Gal", "Leah", "Mashav", "Michael"] as const;

export const ORG_TYPES = [
  "Day school",
  "Supplementary / Hebrew school",
  "Kindergarten / preschool",
  "Synagogue",
  "JCC / community center",
  "Adult-ed program",
  "Ulpan / online program",
  "University Hillel/Chabad",
  "Youth movement / camp",
  "Other",
] as const;

export const AGE_BANDS = [
  "Preschool / kindergarten",
  "Elementary (K-5)",
  "Middle (6-8)",
  "High school (9-12)",
  "K-12 (full)",
  "Adult",
  "Mixed / all ages",
] as const;

export const DENOMINATIONS = [
  "Secular / cultural",
  "Reform",
  "Conservative",
  "Modern Orthodox",
  "Haredi / Orthodox",
  "Community / pluralistic",
  "N/A (consumer)",
] as const;

export const COUNTRIES = [
  "USA",
  "UK",
  "France",
  "Canada",
  "Argentina",
  "Australia",
  "Israel",
  "Other",
] as const;

export const PERSON_ROLES = [
  "Principal / head of school",
  "Curriculum coordinator",
  "Hebrew teacher",
  "Program director",
  "Parent",
  "Student",
  "Partner contact",
  "Investor",
  "Consumer power-user",
  "Other",
] as const;

export const LIFECYCLES = [
  "Discovery",
  "Prospect",
  "Opportunity",
  "Customer",
  "Disqualified",
  "Dormant",
] as const;

export const SOURCES = [
  "Excel / Birthright network",
  "Personal network",
  "LinkedIn outreach",
  "Referral / intro",
  "Inbound / waitlist",
  "Community event",
  "Cold outreach",
] as const;

export const SEGMENTS = [
  "B2B - non-Orthodox school",
  "B2B - supplementary/community",
  "B2B - synagogue/JCC",
  "B2B - kindergarten",
  "Partner - Ulpan",
  "Partner - Birthright/Excel",
  "B2C - Aliyah mover",
  "B2C - olim in Ulpan",
  "B2C - Israeli family/partner",
  "B2C - identity reconnector",
  "B2C - teacher self-buy",
] as const;

export const ORG_STATUSES = [
  "To contact",
  "Outreach sent",
  "Replied",
  "Scheduled",
  "Interviewed",
  "Active",
  "No - dropped",
] as const;

export const B2B_STAGES = [
  "1 Discovery",
  "2 Qualified",
  "3 Demo/Validated",
  "4 Pilot/LOI",
  "5 Proposal",
  "6 Closed Won",
  "6 Closed Lost",
] as const;

export const YES_NO_UNKNOWN = ["Y", "N", "Unknown"] as const;

export const EVAL_TIMINGS = [
  "Now / this term",
  "Next term",
  "Next school year",
  "Budget cycle TBD",
  "No timeline",
] as const;

export const DECISION_TIMELINES = [
  "This term / immediate",
  "Within 3 months",
  "This budget cycle",
  "Next budget cycle",
  "Next school year",
  "6-12 months",
  "Unknown",
] as const;

export const CLOSED_LOST_REASONS = [
  "No budget",
  "No urgency / weak pain",
  "Wrong buyer / no authority",
  "Chose competitor",
  "Chose status quo",
  "No Hebrew program at all",
  "Bad timing",
  "Unresponsive",
] as const;

export const CLOSED_WON_REASONS = [
  "Strong pain + urgency",
  "Champion drove it",
  "Pilot proved ROI",
  "Budget available now",
  "Relationship / trust",
  "Better than incumbent",
] as const;

export const PRIORITIES = ["High", "Medium", "Low"] as const;

export const PILOT_STAGES = [
  "Identified",
  "Agreed (DPA)",
  "Onboarding",
  "Active",
  "Converted",
  "Churned",
] as const;

export const URGENCIES = ["High", "Medium", "Low"] as const;

export const FEEDBACK_CADENCES = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Ad hoc",
  "None yet",
] as const;

export const PARTNER_TYPES = [
  "Reseller",
  "Referral",
  "Co-marketing",
  "Distribution / list access",
] as const;

export const PARTNER_STAGES = [
  "Identified",
  "Pitched",
  "Agreement",
  "Enabled",
  "Productive",
  "Dropped",
] as const;

export const INTERACTION_TYPES = [
  "Discovery interview",
  "Intro call",
  "Demo",
  "Pilot check-in",
  "Email",
  "Meeting",
  "Partner call",
] as const;

// Convenience union types derived from the lists above.
export type Owner = (typeof OWNERS)[number];
export type OrgType = (typeof ORG_TYPES)[number];
export type AgeBand = (typeof AGE_BANDS)[number];
export type Denomination = (typeof DENOMINATIONS)[number];
export type Country = (typeof COUNTRIES)[number];
export type PersonRole = (typeof PERSON_ROLES)[number];
export type Lifecycle = (typeof LIFECYCLES)[number];
export type Source = (typeof SOURCES)[number];
export type Segment = (typeof SEGMENTS)[number];
export type OrgStatus = (typeof ORG_STATUSES)[number];
export type B2bStage = (typeof B2B_STAGES)[number];
export type YesNoUnknown = (typeof YES_NO_UNKNOWN)[number];
export type EvalTiming = (typeof EVAL_TIMINGS)[number];
export type DecisionTimeline = (typeof DECISION_TIMELINES)[number];
export type ClosedLostReason = (typeof CLOSED_LOST_REASONS)[number];
export type ClosedWonReason = (typeof CLOSED_WON_REASONS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type PilotStage = (typeof PILOT_STAGES)[number];
export type Urgency = (typeof URGENCIES)[number];
export type FeedbackCadence = (typeof FEEDBACK_CADENCES)[number];
export type PartnerType = (typeof PARTNER_TYPES)[number];
export type PartnerStage = (typeof PARTNER_STAGES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];
