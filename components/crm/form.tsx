"use client";

import { useFormStatus } from "react-dom";

const fieldBase =
  "w-full rounded-lg border border-white/10 bg-ink-800/80 px-3 py-2 text-sm text-slate-100 " +
  "placeholder:text-slate-600 outline-none transition focus:border-accent/70 focus:bg-ink-800 " +
  "focus:ring-2 focus:ring-accent/20";

function Wrap({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Wrap label={label} required={required} hint={hint}>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className={fieldBase}
      />
    </Wrap>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: number | string | null;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Wrap label={label} hint={hint}>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        inputMode="decimal"
        placeholder={placeholder}
        className={fieldBase}
      />
    </Wrap>
  );
}

export function DateField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
}) {
  return (
    <Wrap label={label} hint={hint}>
      <input type="date" name={name} defaultValue={defaultValue ?? ""} className={fieldBase} />
    </Wrap>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  rows = 3,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Wrap label={label} hint={hint}>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        placeholder={placeholder}
        className={`${fieldBase} resize-y`}
      />
    </Wrap>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  placeholder = "—",
  hint,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  // Keep an unknown existing value selectable so legacy data never disappears.
  const opts =
    defaultValue && !options.includes(defaultValue) ? [defaultValue, ...options] : options;
  return (
    <Wrap label={label} required={required} hint={hint}>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={`${fieldBase} appearance-none`}
      >
        <option value="">{placeholder}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

/** A foreign-key picker: choose a related record by label, submit its id. */
export function RecordSelect({
  name,
  label,
  records,
  defaultValue,
  required,
  hint,
}: {
  name: string;
  label: string;
  records: { id: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Wrap label={label} required={required} hint={hint}>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={`${fieldBase} appearance-none`}
      >
        <option value="">—</option>
        {records.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
      {message}
    </div>
  );
}
