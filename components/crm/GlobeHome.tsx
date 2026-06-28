"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ownerColor, labelColor } from "@/lib/colors";
import { OwnerAvatar } from "./ui";

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
// Scenery lives in the globe's own 3D scene (backgroundColor / image), so the
// space around the planet changes with the time of day.
const PHASE: Record<Phase, { scene: string; sceneImg: string | null; globe: string; atmo: string; label: string }> = {
  dawn: { scene: "#f6c8a6", sceneImg: null, globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", atmo: "#ff9e6b", label: "Dawn" },
  day: { scene: "#bcd9ff", sceneImg: null, globe: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg", atmo: "#dcebff", label: "Day" },
  dusk: { scene: "#5b3b66", sceneImg: null, globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", atmo: "#ff8f6b", label: "Dusk" },
  night: { scene: "#05070f", sceneImg: "//unpkg.com/three-globe/example/img/night-sky.png", globe: "//unpkg.com/three-globe/example/img/earth-night.jpg", atmo: "#5b86ff", label: "Night" },
};

const Pill =
  "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft outline-none transition hover:text-ink";

function Dropdown({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${Pill} appearance-none pr-6`}>
      {children}
    </select>
  );
}

export function GlobeHome({ points, stats }: { points: GlobePoint[]; stats: Stats }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 900, h: 700 });
  const [phase, setPhase] = useState<Phase>("day");
  const [colorBy, setColorBy] = useState<"owner" | "segment" | "kind">("owner");
  const [fOwner, setFOwner] = useState("all");
  const [fSegment, setFSegment] = useState("all");
  const [fCountry, setFCountry] = useState("all");
  const [fKind, setFKind] = useState<"all" | "org" | "person">("all");
  const [statsOpen, setStatsOpen] = useState(true);

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
  // Gentle auto-rotation for a living feel.
  useEffect(() => {
    const g = globeRef.current;
    if (g && g.controls) {
      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.35;
      g.controls().enableZoom = true;
    }
  });

  const ownerCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of points) if (p.owner) m.set(p.owner, (m.get(p.owner) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [points]);
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
        color: colorBy === "owner" ? ownerColor(p.owner) : colorBy === "segment" ? labelColor(p.segment) : p.kind === "org" ? "#22d3ee" : "#f472b6",
      })),
    [filtered, colorBy]
  );
  const active = fOwner !== "all" || fSegment !== "all" || fCountry !== "all" || fKind !== "all";
  const ph = PHASE[phase];

  return (
    <div ref={wrapRef} className="fixed bottom-0 left-56 right-0 top-14 overflow-hidden" style={{ background: ph.scene }}>
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor={ph.scene}
          backgroundImageUrl={ph.sceneImg ?? undefined}
          globeImageUrl={ph.globe}
          showAtmosphere
          atmosphereColor={ph.atmo}
          atmosphereAltitude={0.22}
          pointsData={colored}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.06}
          pointRadius={0.6}
          pointLabel={(d: any) => `<div style="font:600 12px/1.2 ui-sans-serif;padding:2px 4px">${d.label}</div>`}
          onPointClick={(d: any) => router.push(d.href)}
        />
      </div>

      {/* Title */}
      <div className="pointer-events-none absolute left-6 top-5">
        <div className="glass inline-flex flex-col gap-0.5 rounded-2xl px-4 py-3 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">EBY · Mission control</span>
          <span className="text-[19px] font-semibold leading-tight text-ink">The world we are reconnecting</span>
          <span className="text-xs text-ink-muted">{ph.label} · {filtered.length} of {stats.total} shown</span>
        </div>
      </div>

      {/* Stats (collapsible) */}
      <div className="absolute right-6 top-5">
        {statsOpen ? (
          <div className="card animate-rise w-60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="label-eyebrow">Snapshot</span>
              <button onClick={() => setStatsOpen(false)} className="text-xs text-ink-muted hover:text-ink">Hide</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Interviews", value: stats.interviews, href: "/interactions" },
                { label: "People", value: stats.people, href: "/people" },
                { label: "Orgs", value: stats.orgs, href: "/organizations" },
                { label: "Overdue", value: stats.overdue, href: "/people", warn: stats.overdue > 0 },
              ].map((s) => (
                <button key={s.label} onClick={() => router.push(s.href)} className="rounded-xl border border-line bg-surface-muted p-2.5 text-left transition hover:border-primary">
                  <div className="label-eyebrow">{s.label}</div>
                  <div className={`mt-0.5 text-xl font-semibold ${s.warn ? "text-danger" : "text-ink"}`}>{s.value}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, (stats.interviews / 25) * 100)}%` }} />
            </div>
            <button onClick={() => router.push("/dashboard")} className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline">
              Open full dashboard →
            </button>
          </div>
        ) : (
          <button onClick={() => setStatsOpen(true)} className="btn-ghost bg-card text-xs">Snapshot</button>
        )}
      </div>

      {/* Control dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="glass flex flex-wrap items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-pop">
          {/* Type segmented */}
          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {([["all", "All"], ["org", "Orgs"], ["person", "People"]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setFKind(k)} className={`px-3 py-1.5 text-xs font-medium transition ${fKind === k ? "bg-primary text-primary-contrast" : "text-ink-soft hover:bg-surface-muted"}`}>
                {lbl}
              </button>
            ))}
          </div>

          <span className="h-5 w-px bg-line" />

          {/* Owner avatar chips */}
          <div className="flex items-center gap-1">
            {ownerCounts.map(([owner]) => {
              const on = fOwner === owner;
              return (
                <button
                  key={owner}
                  title={owner}
                  onClick={() => setFOwner(on ? "all" : owner)}
                  className={`rounded-full p-0.5 transition ${on ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}
                >
                  <OwnerAvatar owner={owner} size={24} />
                </button>
              );
            })}
          </div>

          <span className="h-5 w-px bg-line" />

          <Dropdown value={fSegment} onChange={setFSegment}>
            <option value="all">All segments</option>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </Dropdown>
          <Dropdown value={fCountry} onChange={setFCountry}>
            <option value="all">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </Dropdown>

          <span className="h-5 w-px bg-line" />

          <Dropdown value={colorBy} onChange={(v) => setColorBy(v as any)}>
            <option value="owner">Color: owner</option>
            <option value="segment">Color: segment</option>
            <option value="kind">Color: type</option>
          </Dropdown>

          {active && (
            <button onClick={() => { setFOwner("all"); setFSegment("all"); setFCountry("all"); setFKind("all"); }} className={Pill}>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
