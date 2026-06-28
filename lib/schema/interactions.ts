import type { ObjectDef } from "./types";

export const interactionsDef: ObjectDef = {
  key: "interactions",
  table: "interactions",
  label: "Interactions",
  singular: "Interaction",
  idPrefix: "INT",
  appendOnly: true,
  title: (r) => [r.type, r.date].filter(Boolean).join(" · ") || r.display_id || "Interaction",
  blurb: "Append-only log of every conversation and touch.",
  searchFields: ["outcome", "verbatim_quote"],
  listColumns: ["date", "type", "person_id", "org_id", "owner"],
  quickCreate: ["date", "type", "person_id", "org_id", "owner"],
  linked: [],
  fields: [
    { name: "date", label: "Date", widget: "date", defaultToday: true, showInList: true, section: "Basics", help: "When the conversation happened." },
    { name: "type", label: "Type", widget: "combobox", optionsKey: "interaction_type", addNew: true, showInList: true, section: "Basics" },
    { name: "owner", label: "Owner", widget: "combobox", optionsKey: "owner", addNew: true, showInList: true, section: "Basics", help: "Which EBY teammate was on the call." },

    { name: "person_id", label: "Person", widget: "fk", fkTo: "people", inlineCreate: true, showInList: true, section: "Links", help: "Who we spoke with." },
    { name: "org_id", label: "Organization", widget: "fk", fkTo: "organizations", inlineCreate: true, showInList: true, section: "Links", help: "Their organization." },
    { name: "deal_id", label: "Deal", widget: "fk", fkTo: "deals", inlineCreate: true, section: "Links", help: "Related deal, if any." },

    { name: "outcome", label: "Outcome", widget: "textarea", section: "Substance", hint: "What happened." },
    { name: "verbatim_quote", label: "Verbatim quote", widget: "textarea", quote: true, section: "Substance", hint: "Their exact words. This is the Mom-Test gold." },

    { name: "next_step", label: "Next step", widget: "text", section: "Follow-up" },
    { name: "next_step_date", label: "Next-step date", widget: "date", showInList: true, section: "Follow-up", help: "Shows red on the dashboard when due or overdue." },
  ],
};
