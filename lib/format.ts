import type { Person } from "./db-types";

/** Display name for a person, gracefully handling missing names. */
export function personName(p: Pick<Person, "first_name" | "last_name">): string {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name || "(no name)";
}

/** True if a next-step date is today or in the past (overdue follow-up). */
export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  return d.getTime() <= today.getTime();
}

/** Human-friendly date (e.g. "Jun 26, 2026"); empty string for null. */
export function fmtDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Turn a FormData value into a trimmed string or null (empty -> null). */
export function str(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** Turn a FormData value into a number or null. */
export function num(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s == null) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}
