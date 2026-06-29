"use client";

import Link from "next/link";
import type { FieldDef } from "@/lib/schema/types";
import type { OptionsMap } from "@/lib/options";
import { COUNTRIES_FULL } from "@/lib/countries";
import { TextField, TextArea, NumberField, DateField, SelectField, SubmitButton } from "./form";
import { Combobox } from "./Combobox";
import { RecordPicker } from "./RecordPicker";

export interface FkData {
  records: { id: string; label: string }[];
  createFields: FieldDef[];
  targetKey: string;
  targetSingular: string;
}

function FieldInput({
  field,
  value,
  options,
  fk,
}: {
  field: FieldDef;
  value: any;
  options: OptionsMap;
  fk?: FkData;
}) {
  const common = { name: field.name, label: field.label, help: field.help, required: field.required };
  switch (field.widget) {
    case "textarea":
      return <TextArea {...common} defaultValue={value} rows={4} placeholder={field.placeholder} />;
    case "number":
    case "money":
      return <NumberField {...common} defaultValue={value} placeholder={field.placeholder} />;
    case "date":
      return <DateField {...common} defaultValue={value} />;
    case "select":
      return <SelectField {...common} options={field.optionsKey ? options[field.optionsKey] ?? [] : []} defaultValue={value} />;
    case "combobox":
      return (
        <Combobox
          {...common}
          options={field.optionsKey ? options[field.optionsKey] ?? [] : []}
          defaultValue={value}
          fieldKey={field.addNew ? field.optionsKey : undefined}
        />
      );
    case "country":
      return <Combobox {...common} options={COUNTRIES_FULL} defaultValue={value} placeholder="Search countries…" />;
    case "fk":
      return (
        <RecordPicker
          name={field.name}
          label={field.label}
          help={field.help}
          records={fk?.records ?? []}
          defaultValue={value}
          targetKey={fk?.targetKey ?? field.fkTo ?? ""}
          targetSingular={fk?.targetSingular ?? "record"}
          createFields={field.inlineCreate ? fk?.createFields ?? [] : []}
          options={options}
          inlineCreate={field.inlineCreate}
        />
      );
    case "email":
      return <TextField {...common} type="email" defaultValue={value} placeholder={field.placeholder} />;
    default:
      return <TextField {...common} defaultValue={value} placeholder={field.placeholder} />;
  }
}

export function RecordForm({
  fields,
  record,
  options,
  fk = {},
  action,
  submitLabel,
  cancelHref,
}: {
  fields: FieldDef[];
  record?: Record<string, any>;
  options: OptionsMap;
  fk?: Record<string, FkData>;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  // Group fields by section, preserving first-seen order.
  const sections: { name: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    const key = f.section ?? "Details";
    let s = sections.find((x) => x.name === key);
    if (!s) {
      s = { name: key, fields: [] };
      sections.push(s);
    }
    s.fields.push(f);
  }

  return (
    <form action={action} className="space-y-5">
      {sections.map((s) => (
        <section key={s.name} className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{s.name}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {s.fields.map((f) => (
              <div key={f.name} className={f.widget === "textarea" ? "md:col-span-2" : ""}>
                <FieldInput field={f} value={record?.[f.name]} options={options} fk={f.fkTo ? fk[f.fkTo] : undefined} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
