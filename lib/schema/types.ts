/**
 * Field-registry types. Each object is described ONCE with these, and generic
 * components render its list, detail, and form. Changing a label, widget, help
 * text, or visibility is a one-line edit here that applies everywhere.
 *
 * This file is plain data (no server-only imports) so it can be used in both
 * server and client components.
 */

export type Widget =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "money"
  | "date"
  | "select" // dropdown from field_options (no free add)
  | "combobox" // searchable dropdown from field_options, optional add-new
  | "country" // searchable full country list
  | "fk"; // foreign-key picker (searchable, optional inline create)

export interface FieldDef {
  name: string; // db column
  label: string;
  widget: Widget;
  /** field_options key for select/combobox (e.g. "segment"). */
  optionsKey?: string;
  /** combobox can create a brand-new option inline. */
  addNew?: boolean;
  /** target object key for fk widget (e.g. "organizations"). */
  fkTo?: string;
  /** fk picker can create the related record inline. */
  inlineCreate?: boolean;
  required?: boolean;
  /** show as a column in the list view. */
  showInList?: boolean;
  /** show on the detail page (default true). */
  showInDetail?: boolean;
  /** section label for grouping on form + detail. */
  section?: string;
  /** hover help shown via a tooltip next to the label. */
  help?: string;
  placeholder?: string;
  /** render the value italic in quotes (verbatim quotes / pains). */
  quote?: boolean;
  /** column width hint for list (unused yet). */
  listLabel?: string;
}

export interface LinkedDef {
  object: string; // related object key
  fk: string; // the column on the related table pointing back here
  label: string;
}

export interface ObjectDef {
  key: string; // url + registry key, e.g. "people"
  table: string; // db table
  label: string; // plural, e.g. "People"
  singular: string; // e.g. "Person"
  idPrefix: string; // e.g. "PER"
  /** how to title a record; given the row, return a string. */
  title: (row: Record<string, any>) => string;
  /** subtitle on lists / pickers (optional). */
  subtitle?: string;
  fields: FieldDef[];
  /** order of column names shown in the list (besides the title). */
  listColumns: string[];
  /** db columns to search in the list/pickers. */
  searchFields: string[];
  /** related records to show on the detail page. */
  linked?: LinkedDef[];
  /** minimal fields for inline "quick create" from an fk picker. */
  quickCreate?: string[];
  /** interactions-style: can be created but never edited/deleted. */
  appendOnly?: boolean;
  /** intro line shown under the page title on the list. */
  blurb?: string;
}

export const fieldByName = (def: ObjectDef, name: string) =>
  def.fields.find((f) => f.name === name);
