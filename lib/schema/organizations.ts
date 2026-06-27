import type { ObjectDef } from "./types";

export const organizationsDef: ObjectDef = {
  key: "organizations",
  table: "organizations",
  label: "Organizations",
  singular: "Organization",
  idPrefix: "ORG",
  title: (r) => r.name ?? "(unnamed)",
  blurb: "Schools, synagogues, JCCs, Ulpans, and partner organizations.",
  searchFields: ["name", "domain", "city", "country", "segment"],
  listColumns: ["org_type", "segment", "city", "country", "owner", "status"],
  quickCreate: ["name", "org_type", "segment", "city", "country"],
  linked: [
    { object: "people", fk: "org_id", label: "People at this organization" },
    { object: "deals", fk: "org_id", label: "Deals" },
    { object: "interactions", fk: "org_id", label: "Interactions" },
  ],
  fields: [
    { name: "name", label: "Organization name", widget: "text", required: true, showInList: true, section: "Basics" },
    { name: "domain", label: "Website / domain", widget: "text", placeholder: "example.org", section: "Basics", help: "The org's web domain. Used to recognize duplicates." },
    { name: "org_type", label: "Org type", widget: "combobox", optionsKey: "org_type", addNew: true, showInList: true, section: "Basics", help: "What kind of organization this is." },
    { name: "segment", label: "Segment", widget: "combobox", optionsKey: "segment", addNew: true, showInList: true, section: "Basics", help: "The go-to-market segment this org belongs to." },
    { name: "age_band", label: "Age / grade band", widget: "combobox", optionsKey: "age_band", addNew: true, section: "Profile" },
    { name: "denomination", label: "Denomination", widget: "combobox", optionsKey: "denomination", addNew: true, section: "Profile", help: "Religious affiliation, where relevant." },
    { name: "city", label: "City", widget: "text", showInList: true, section: "Location" },
    { name: "country", label: "Country", widget: "country", showInList: true, section: "Location" },
    { name: "size", label: "Size (students / seats)", widget: "text", section: "Profile", help: "Rough size. Free text (e.g. 420, or n/a)." },
    { name: "affiliation", label: "Affiliation / network", widget: "text", section: "Profile", help: "Umbrella network, e.g. Schechter, URJ." },
    { name: "owner", label: "Owner", widget: "combobox", optionsKey: "owner", addNew: true, showInList: true, section: "Tracking", help: "Which EBY teammate owns this relationship." },
    { name: "status", label: "Status", widget: "combobox", optionsKey: "org_status", addNew: true, showInList: true, section: "Tracking", help: "Where outreach to this org stands." },
    { name: "notes", label: "Notes", widget: "textarea", section: "Notes" },
  ],
};
