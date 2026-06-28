"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ownerColor, labelColor } from "@/lib/colors";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export interface GlobePoint {
  id: string;
  kind: "org" | "person";
  name: string;
  label: string;
  owner: string | null;
  segment: string | null;
  country: string | null;
  lat: number;
  lng: number;
  href: string;
}
interface Stats {
  interviews: number;
  people: number;
  orgs: number;
  deals: number;
  overdue: number;
  placed: number;
  total: number;
}

type Phase = "dawn" | "day" | "dusk" | "night";
function currentPhase(): Phase {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}
const PHASE: Record<Phase, { backdrop: string; globe: string; stars: boolean; atmo: string; label: string }> = {
  dawn: { backdrop: "radial-gradient(120% 100% at 50% 120%, #ffd9a8 0%, #ffb3c1 35%, #cfe0ff 80%)", globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", stars: false, atmo: "#ffb27a", label: "Dawn" },
  day: { backdrop: "radial-gradient(120% 100% at 50% 0%, #bcd9ff 0%, #eaf3ff 45%, #fbf8f1 100%)", globe: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg", stars: false, atmo: "#7fb0ff", label: "Day" },
  dusk: { backdrop: "radial-gradient(120% 100% at 50% 120%, #ff9e7a 0%, #b06ab3 45%, #20204f 90%)", globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", stars: false, atmo: "#ff8f6b", label: "Dusk" },
  night: { backdrop: "radial-gradient(120% 100% at 50% -10%, #14224a 0%, #0a1230 45%, #05070f 100%)", globe: "//unpkg.com/three-globe/example/img/earth-night.jpg", stars: true, atmo: "#5b86ff", label: "Night" },
};

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs text-ink outline-none backdrop-blur focus:border-primary"
    >
      {children}
    </select>
  );
}

export function GlobeHome({ points, stats }: { points: GlobePoint[]; stats: Stats }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 700 });
  const [phase, setPhase] = useState<Phase>("day");
  const [colorBy, setColorBy] = useState<"owner" | "segment" | "kind">("owner");
  const [fOwner, setFOwner] = useState("all");
  const [fSegment, setFSegment] = useState("all");
  const [fCountry, setFCountry] = useState("all");
  const [fKind, setFKind] = useState<"all" | "org" | "person">("all");
  const [dashOpen, setDashOpen] = useState(true);

  useEffect(() => setPhase(currentPhase()), []);
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => {
      const r = e[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const owners = useMemo(() => Array.from(new Set(points.map((p) => p.owner).filter(Boolean))) as string[], [points]);
  const segments = useMemo(() => Array.from(new Set(points.map((p) => p.segment).filter(Boolean))) as string[], [points]);
  const countries = useMemo(() => Array.from(new Set(points.map((p) => p.country).filter(Boolean))) as string[], [points]);

  const filtered = useMemo(
    () =>
      points.filter(
        (p) =>
          (fOwner === "all" || p.owner === fOwner) &&
          (fSegment === "all" || p.segment === fSegment) &&
          (fCountry === "all" || p.country === fCountry) &&
          (fKind === "all" || p.kind === fKind)
      ),
    [points, fOwner, fSegment, fCountry, fKind]
  );

  const colored = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        color:
          colorBy === "owner" ? ownerColor(p.owner) : colorBy === "segment" ? labelColor(p.segment) : p.kind === "org" ? "#22d3ee" : "#f472b6",
      })),
    [filtered, colorBy]
  );

  const ph = PHASE[phase];

  return (
    <div ref={wrapRef} className="fixed bottom-0 left-56 right-0 top-14 overflow-hidden">
      {/* Time-of-day backdrop */}
      <div className="absolute inset-0" style={{ background: ph.backdrop }} />
      {ph.stars && <div className="absolute inset-0 opacity-90" style={{ backgroundImage: "url(//unpkg.com/three-globe/example/img/night-sky.png)", backgroundSize: "cover" }} />}

      <div className="absolute inset-0">
        <Globe
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={ph.globe}
          showAtmosphere
          atmosphereColor={ph.atmo}
          atmosphereAltitude={0.2}
          pointsData={colored}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.05}
          pointRadius={0.55}
          pointLabel={(d: any) => `<div style="font-size:12px;font-weight:600">${d.label}</div>`}
          onPointClick={(d: any) => router.push(d.href)}
        />
      </div>

      {/* Title + phase */}
      <div className="pointer-events-none absolute left-5 top-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">EBY · Mission control</div>
        <div className="text-lg font-semibold text-ink">The world we are reconnecting</div>
        <div className="mt-0.5 text-xs text-ink-muted">{ph.label} · {stats.placed} of {stats.total} on the map</div>
      </div>

      {/* Filters */}
      <div className="absolute left-5 top-24 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-line text-xs">
          {(["all", "org", "person"] as const).map((k) => (
            <button key={k} onClick={() => setFKind(k)} className={`px-2.5 py-1.5 ${fKind === k ? "bg-primary text-primary-contrast" : "bg-card text-ink-soft hover:bg-surface-muted"}`}>
              {k === "all" ? "All" : k === "org" ? "Orgs" : "People"}
            </button>
          ))}
        </div>
        <Select value={fOwner} onChange={setFOwner}>
          <option value="all">All owners</option>
          {owners.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select value={fSegment} onChange={setFSegment}>
          <option value="all">All segments</option>
          {segments.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={fCountry} onChange={setFCountry}>
          <option value="all">All countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={colorBy} onChange={(v) => setColorBy(v as any)}>
          <option value="owner">Color: owner</option>
          <option value="segment">Color: segment</option>
          <option value="kind">Color: type</option>
        </Select>
        {(fOwner !== "all" || fSegment !== "all" || fCountry !== "all" || fKind !== "all") && (
          <button onClick={() => { setFOwner("all"); setFSegment("all"); setFCountry("all"); setFKind("all"); }} className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink">
            Clear
          </button>
        )}
        <span className="rounded-lg bg-card px-2.5 py-1.5 text-xs font-medium text-ink">{filtered.length} shown</span>
      </div>

      {/* Legend (owners) */}
      {colorBy === "owner" && owners.length > 0 && (
        <div className="absolute bottom-4 left-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-3 py-2 backdrop-blur">
          {owners.map((o) => (
            <span key={o} className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ownerColor(o) }} /> {o}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible dashboard */}
      <div className={`absolute right-4 top-4 transition-all ${dashOpen ? "w-64" : "w-auto"}`}>
        {dashOpen ? (
          <div className="card animate-rise p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="label-eyebrow">Dashboard</span>
              <button onClick={() => setDashOpen(false)} className="text-xs text-ink-muted hover:text-ink" title="Minimize">Minimize</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Interviews", value: stats.interviews, href: "/interactions", sub: "/ 25 goal" },
                { label: "People", value: stats.people, href: "/people" },
                { label: "Organizations", value: stats.orgs, href: "/organizations" },
                { label: "Deals", value: stats.deals, href: "/deals" },
                { label: "Overdue", value: stats.overdue, href: "/people", warn: stats.overdue > 0 },
              ].map((s) => (
                <button key={s.label} onClick={() => router.push(s.href)} className="rounded-xl border border-line bg-surface-muted p-2.5 text-left transition hover:border-primary">
                  <div className="label-eyebrow">{s.label}</div>
                  <div className={`mt-1 text-2xl font-semibold ${s.warn ? "text-danger" : "text-ink"}`}>{s.value}</div>
                  {s.sub && <div className="text-[10px] text-ink-muted">{s.sub}</div>}
                </button>
              ))}
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (stats.interviews / 25) * 100)}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-ink-muted">{stats.interviews} / 25 discovery interviews</div>
          </div>
        ) : (
          <button onClick={() => setDashOpen(true)} className="btn-primary text-xs">
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
