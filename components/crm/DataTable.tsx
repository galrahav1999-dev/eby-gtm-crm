"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, IdTag } from "./ui";
import { fmtDate, isOverdue } from "@/lib/format";
import { labelColor } from "@/lib/colors";

export type ColumnKind = "text" | "strong" | "badge" | "owner" | "id" | "date" | "nextdate";

export interface Column {
  key: string;
  header: string;
  kind?: ColumnKind;
}
export interface DataRow {
  id: string;
  [key: string]: unknown;
}

function initials(name: string): string {
  const parts = name.replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const empty = !name || name === "(no name)";
  const c = empty ? "#94a3b8" : labelColor(name);
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-1 ring-black/5"
      style={{ background: `linear-gradient(140deg, ${c}, ${c}b3)` }}
    >
      {empty ? "·" : initials(name)}
    </span>
  );
}

export function DataTable({
  rows,
  columns,
  basePath,
  searchPlaceholder = "Search…",
}: {
  rows: DataRow[];
  columns: Column[];
  basePath: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);

  const filtered = useMemo(() => {
    let r = rows;
    if (q.trim()) {
      const needle = q.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(needle)));
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return r;
  }, [rows, columns, q, sortKey, asc]);

  function toggleSort(key: string) {
    if (sortKey === key) setAsc(!asc);
    else { setSortKey(key); setAsc(true); }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <div className="relative w-full max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-line bg-surface-muted py-2 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-line text-ink-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition hover:text-ink"
                >
                  {c.header}
                  {sortKey === c.key && <span className="ml-1 text-primary">{asc ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`${basePath}/${row.id}`)}
                className="group cursor-pointer border-b border-line-soft transition last:border-0 hover:bg-surface-muted"
              >
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3.5">
                    <Cell value={row[c.key]} kind={c.kind} />
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-ink-muted">
                  Nothing matches “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ value, kind }: { value: unknown; kind?: ColumnKind }) {
  const s = value == null ? "" : String(value);
  if (!s && kind !== "text" && kind !== "strong") return <span className="text-ink-muted">—</span>;
  switch (kind) {
    case "strong":
      return (
        <span className="flex items-center gap-2.5">
          <Avatar name={s} />
          <span className="font-medium text-ink group-hover:text-primary">{s || "—"}</span>
        </span>
      );
    case "id":
      return <IdTag id={s} />;
    case "badge":
      return <Badge value={s} />;
    case "owner":
      return <Badge value={s} kind="owner" />;
    case "date":
      return <span className="text-ink-soft">{fmtDate(s)}</span>;
    case "nextdate":
      return (
        <span className={isOverdue(s) ? "font-medium text-danger" : "text-ink-soft"}>
          {fmtDate(s)}
          {isOverdue(s) && <span className="ml-1 text-xs">(due)</span>}
        </span>
      );
    default:
      return <span className="text-ink-soft">{s}</span>;
  }
}
