import type { ObjectDef } from "./types";

export const pilotsDef: ObjectDef = {
  key: "pilots",
  table: "pilots",
  label: "Pilots",
  singular: "Pilot",
  idPrefix: "PLT",
  title: (r) => r.display_id ?? "Pilot",
  blurb: "Design-partner pilots and their path to conversion.",
  searchFields: ["success_metric", "capability", "notes"],
  listColumns: ["org_id", "stage", "urgency", "owner", "convert_by"],
  quickCreate: ["org_id", "stage", "owner"],
  linked: [],
  fields: [
    { name: "org_id", label: "Organization", widget: "fk", fkTo: "organizations", inlineCreate: true, showInList: true, section: "Setup", help: "The org running the pilot." },
    { name: "champion_id", label: "Champion", widget: "fk", fkTo: "people", inlineCreate: true, section: "Setup", help: "The internal advocate driving the pilot." },
    { name: "stage", label: "Stage", widget: "combobox", optionsKey: "pilot_stage", addNew: true, showInList: true, section: "Setup" },

    { name: "urgency", label: "Urgency", widget: "combobox", optionsKey: "urgency", addNew: true, showInList: true, section: "Fit", hint: "Real, burning need?" },
    { name: "capability", label: "Capability", widget: "text", section: "Fit", hint: "Can they implement?" },
    { name: "representativeness", label: "Representativeness", widget: "text", section: "Fit", hint: "Typical of the market?" },
    { name: "success_metric", label: "Success metric", widget: "text", section: "Fit", hint: "The agreed measure of success." },

    { name: "feedback_cadence", label: "Feedback cadence", widget: "combobox", optionsKey: "feedback_cadence", addNew: true, section: "Operating cadence" },
    { name: "dpa_signed", label: "DPA signed?", widget: "select", optionsKey: "yes_no_unknown", section: "Operating cadence", help: "Whether the data processing agreement is signed." },
    { name: "convert_by", label: "Convert-by date", widget: "date", showInList: true, section: "Operating cadence", help: "Target date to convert to a paid deal." },

    { name: "owner", label: "Owner", widget: "combobox", optionsKey: "owner", addNew: true, showInList: true, section: "Tracking", help: "Which EBY teammate owns this pilot." },
    { name: "next_step", label: "Next step", widget: "text", section: "Tracking" },

    { name: "notes", label: "Notes", widget: "textarea", section: "Notes" },
  ],
};
