import type { ObjectDef } from "./types";

/**
 * URL/registry key is "waitlist" (matches the existing /waitlist route); the DB
 * table is waitlist_cohorts. The two funnel percentages (confirm rate and
 * signup-to-paid) are computed in the UI at render time, never stored, so they
 * are not fields here; the custom list/detail renderer derives them (Tier 1).
 */
export const waitlistCohortsDef: ObjectDef = {
  key: "waitlist",
  table: "waitlist_cohorts",
  label: "B2C waitlist",
  singular: "Cohort",
  idPrefix: "WL",
  title: (r) => r.cohort_label ?? "(cohort)",
  blurb: "B2C signup cohorts and their funnel.",
  searchFields: ["cohort_label", "notes"],
  listColumns: ["segment", "signups", "paid"],
  quickCreate: ["cohort_label", "segment"],
  linked: [],
  fields: [
    { name: "cohort_label", label: "Cohort", widget: "text", required: true, showInList: true, section: "Basics", placeholder: "e.g. 2026-06 Excel referral", help: "Month plus source." },
    { name: "segment", label: "Segment", widget: "combobox", optionsKey: "segment", addNew: true, showInList: true, section: "Basics" },

    { name: "signups", label: "Signups", widget: "number", integer: true, showInList: true, group: "Funnel", section: "Funnel" },
    { name: "confirmed", label: "Confirmed", widget: "number", integer: true, group: "Funnel", section: "Funnel" },
    { name: "activated", label: "Activated", widget: "number", integer: true, group: "Funnel", section: "Funnel" },
    { name: "retained_d30", label: "Retained (D30)", widget: "number", integer: true, group: "Funnel", section: "Funnel", help: "Still active at 30 days." },
    { name: "paid", label: "Paid", widget: "number", integer: true, showInList: true, group: "Funnel", section: "Funnel" },

    { name: "notes", label: "Notes", widget: "textarea", section: "Notes" },
  ],
};
