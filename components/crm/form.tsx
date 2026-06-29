"use client";

import { useFormStatus } from "react-dom";
import { HelpTip } from "./ui";

const fieldBase =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-muted outline-none transition focus:border-primary focus:bg-card " +
  "focus:ring-2 focus:ring-primary";

export function Wrap({
  label,
  required,
  hint,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  help?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-rose-400">*</span>}
        <HelpTip text={help} />
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
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
  help,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  help?: string | null;
  type?: string;
}) {
  return (
    <Wrap label={label} required={required} hint={hint} help={help}>
      <input type={type} name={name} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} className={fieldBase} />
    </Wrap>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  help,
}: {
  name: string;
  label: string;
  defaultValue?: number | string | null;
  placeholder?: string;
  hint?: string;
  help?: string | null;
}) {
  return (
    <Wrap label={label} hint={hint} help={help}>
      <input name={name} defaultValue={defaultValue ?? ""} inputMode="decimal" placeholder={placeholder} className={fieldBase} />
    </Wrap>
  );
}

export function DateField({
  name,
  label,
  defaultValue,
  hint,
  help,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  help?: string | null;
}) {
  return (
    <Wrap label={label} hint={hint} help={help}>
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
  help,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  hint?: string;
  help?: string | null;
}) {
  return (
    <Wrap label={label} hint={hint} help={help}>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} placeholder={placeholder} className={`${fieldBase} resize-y`} />
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
  help,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  help?: string | null;
}) {
  const opts = defaultValue && !options.includes(defaultValue) ? [defaultValue, ...options] : options;
  return (
    <Wrap label={label} required={required} hint={hint} help={help}>
      <select name={name} defaultValue={defaultValue ?? ""} required={required} className={`${fieldBase} appearance-none`}>
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

export function RecordSelect({
  name,
  label,
  records,
  defaultValue,
  required,
  hint,
  help,
}: {
  name: string;
  label: string;
  records: { id: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
  help?: string | null;
}) {
  return (
    <Wrap label={label} required={required} hint={hint} help={help}>
      <select name={name} defaultValue={defaultValue ?? ""} required={required} className={`${fieldBase} appearance-none`}>
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
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{message}</div>
  );
}
