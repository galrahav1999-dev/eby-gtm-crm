import type { ObjectDef } from "./types";

export const partnersDef: ObjectDef = {
  key: "partners",
  table: "partners",
  label: "Partners",
  singular: "Partner",
  idPrefix: "PTR",
  title: (r) => r.partner_org ?? "(unnamed partner)",
  blurb: "Channel and referral partners: Ulpans, Birthright, networks.",
  searchFields: ["partner_org", "what_they_give", "notes"],
  listColumns: ["partner_type", "stage", "owner", "next_step_date"],
  quickCreate: ["partner_org", "partner_type", "stage", "owner"],
  linked: [],
  fields: [
    { name: "partner_org", label: "Partner organization", widget: "text", required: true, showInList: true, section: "Basics", help: "The partner org name (free text today, not a linked record)." },
    { name: "partner_type", label: "Partner type", widget: "combobox", optionsKey: "partner_type", addNew: true, showInList: true, section: "Basics" },
    { name: "primary_contact_id", label: "Primary contact", widget: "fk", fkTo: "people", inlineCreate: true, section: "Basics", help: "The main person at the partner." },
    { name: "stage", label: "Stage", widget: "combobox", optionsKey: "partner_stage", addNew: true, showInList: true, section: "Basics" },
    { name: "owner", label: "Owner", widget: "combobox", optionsKey: "owner", addNew: true, showInList: true, section: "Basics", help: "Which EBY teammate owns this partner." },

    { name: "expected_reach", label: "Expected reach", widget: "text", section: "Value", hint: "Number of end-customers they can reach." },
    { name: "what_they_give", label: "What they give us", widget: "text", section: "Value", hint: "The reach or access they provide." },
    { name: "terms", label: "Commission / terms", widget: "text", section: "Value" },

    { name: "next_step", label: "Next step", widget: "text", section: "Tracking" },
    { name: "next_step_date", label: "Next-step date", widget: "date", showInList: true, section: "Tracking", help: "Shows red on the dashboard when due or overdue." },

    { name: "notes", label: "Notes", widget: "textarea", section: "Notes" },
  ],
};
