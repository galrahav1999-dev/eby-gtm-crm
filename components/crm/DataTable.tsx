"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, IdTag } from "./ui";
import { fmtDate, isOverdue } from "@/lib/format";

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
      r = r.filter((row) =>
        columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(needle))
      );
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
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-lg border border-white/10 bg-ink-800/80 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
        />
        <span className="shrink-0 text-xs text-slate-500">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-400">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:text-slate-200"
                >
                  {c.header}
                  {sortKey === c.key && <span className="ml-1">{asc ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`${basePath}/${row.id}`)}
                className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
              >
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3">
                    <Cell value={row[c.key]} kind={c.kind} />
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
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
  if (!s && kind !== "text") return <span className="text-slate-600">—</span>;
  switch (kind) {
    case "strong":
      return <span className="font-medium text-white">{s || "—"}</span>;
    case "id":
      return <IdTag id={s} />;
    case "badge":
      return <Badge value={s} />;
    case "owner":
      return <Badge value={s} kind="owner" />;
    case "date":
      return <span className="text-slate-300">{fmtDate(s)}</span>;
    case "nextdate":
      return (
        <span className={isOverdue(s) ? "font-medium text-rose-300" : "text-slate-300"}>
          {fmtDate(s)}
          {isOverdue(s) && <span className="ml-1 text-xs">(due)</span>}
        </span>
      );
    default:
      return <span className="text-slate-300">{s}</span>;
  }
}
