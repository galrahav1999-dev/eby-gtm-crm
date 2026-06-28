import type { ObjectDef } from "./types";

const isClosedWon = (r: Record<string, any>) => typeof r.stage === "string" && /won/i.test(r.stage);
const isClosedLost = (r: Record<string, any>) => typeof r.stage === "string" && /lost/i.test(r.stage);

export const dealsDef: ObjectDef = {
  key: "deals",
  table: "deals",
  label: "Deals",
  singular: "Deal",
  idPrefix: "DL",
  title: (r) => r.name ?? "(unnamed deal)",
  blurb: "B2B opportunities with schools and organizations.",
  searchFields: ["name", "pains", "notes"],
  listColumns: ["org_id", "stage", "priority", "owner", "next_step_date"],
  quickCreate: ["name", "org_id", "stage", "owner"],
  linked: [{ object: "interactions", fk: "deal_id", label: "Interactions" }],
  fields: [
    { name: "name", label: "Deal name", widget: "text", required: true, showInList: true, section: "Basics", placeholder: "e.g. Hartman - K8 spoken Hebrew pilot" },
    { name: "org_id", label: "Organization", widget: "fk", fkTo: "organizations", inlineCreate: true, showInList: true, section: "Basics", help: "The school or org this deal is with. You can create it right here." },
    { name: "stage", label: "Stage", widget: "combobox", optionsKey: "b2b_stage", addNew: true, showInList: true, section: "Basics", help: "Where this deal sits in the pipeline." },
    { name: "priority", label: "Priority", widget: "combobox", optionsKey: "priority", addNew: true, showInList: true, section: "Basics" },
    { name: "owner", label: "Owner", widget: "combobox", optionsKey: "owner", addNew: true, showInList: true, section: "Basics", help: "Which EBY teammate owns this deal." },

    { name: "economic_buyer_id", label: "Economic buyer", widget: "fk", fkTo: "people", inlineCreate: true, section: "Who's who", group: "Who's who", hint: "Controls budget, signs." },
    { name: "poc_id", label: "Point of contact", widget: "fk", fkTo: "people", inlineCreate: true, section: "Who's who", group: "Who's who", hint: "Day-to-day coordinator." },
    { name: "champion_id", label: "Champion", widget: "fk", fkTo: "people", inlineCreate: true, section: "Who's who", group: "Who's who", hint: "Advocates for us inside." },

    { name: "has_hebrew", label: "Has a Hebrew program today?", widget: "select", optionsKey: "yes_no_unknown", section: "Qualification" },
    { name: "current_solution", label: "Current solution / curriculum", widget: "text", section: "Qualification" },
    { name: "current_state", label: "Current state", widget: "textarea", section: "Qualification", hint: "How it is going today." },
    { name: "pains", label: "Pains", widget: "textarea", quote: true, section: "Qualification", hint: "Quote them verbatim. This is the real signal." },
    { name: "ideal_state", label: "Ideal state", widget: "textarea", section: "Qualification", hint: "What good looks like to them." },
    { name: "eval_timing", label: "Eval start timing", widget: "combobox", optionsKey: "eval_timing", addNew: true, section: "Qualification" },
    { name: "decision_timeline", label: "Decision timeline", widget: "combobox", optionsKey: "decision_timeline", addNew: true, section: "Qualification" },

    { name: "seats", label: "Seats (qty)", widget: "number", integer: true, section: "Commercials" },
    { name: "acv", label: "ACV / expected value", widget: "money", section: "Commercials", placeholder: "e.g. 36000" },
    { name: "opportunity_start", label: "Opportunity start", widget: "date", section: "Commercials" },
    { name: "expected_close", label: "Expected close", widget: "date", section: "Commercials" },
    { name: "next_step", label: "Next step", widget: "text", section: "Commercials" },
    { name: "next_step_date", label: "Next-step date", widget: "date", showInList: true, section: "Commercials", help: "Shows red on the dashboard when due or overdue." },

    { name: "closed_won_reason", label: "Closed-won reason", widget: "combobox", optionsKey: "closed_won_reason", addNew: true, section: "If closed", help: "Fill only when the deal is won.", showWhen: isClosedWon },
    { name: "closed_lost_reason", label: "Closed-lost reason", widget: "combobox", optionsKey: "closed_lost_reason", addNew: true, section: "If closed", help: "Fill only when the deal is lost.", showWhen: isClosedLost },

    { name: "notes", label: "Notes", widget: "textarea", section: "Notes" },
  ],
};
