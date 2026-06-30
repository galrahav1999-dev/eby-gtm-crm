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
  // Dedicated sunrise/sunset views: one hour before to one hour after
  // (sunrise ~06:00, sunset ~19:00, no geolocation).
  if (h >= 5 && h < 7) return "dawn"; // sunrise
  if (h >= 7 && h < 18) return "day";
  if (h >= 18 && h < 20) return "dusk"; // sunset
  return "night";
}
// Atmospheric scenery layered in the area around the globe; changes with the
// time of day. The globe's own background is transparent so these show through.
interface PhaseDef {
  base: string;
  accent?: string;
  glow: string;
  vignette: string;
  stars: number; // star opacity 0..1
  globe: string;
  atmo: string;
  label: string;
}
const STARS = "//unpkg.com/three-globe/example/img/night-sky.png";
const PHASE: Record<Phase, PhaseDef> = {
  dawn: {
    base: "linear-gradient(180deg,#bcd2ff 0%,#ffd9c2 56%,#ffc2cf 100%)",
    accent: "radial-gradient(70% 55% at 50% 82%, rgba(255,176,120,.55), transparent 70%)",
    glow: "rgba(255,160,120,.40)", vignette: "radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(40,20,30,.18))",
    stars: 0, globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", atmo: "#ff9e6b", label: "Sunrise",
  },
  day: {
    base: "linear-gradient(180deg,#a9caf3 0%,#d8e8ff 46%,#fbf8f1 100%)",
    accent: "radial-gradient(55% 40% at 82% 6%, rgba(255,240,205,.6), transparent 60%)",
    glow: "rgba(120,170,255,.30)", vignette: "radial-gradient(120% 100% at 50% 50%, transparent 65%, rgba(20,40,80,.12))",
    stars: 0, globe: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg", atmo: "#dcebff", label: "Day",
  },
  dusk: {
    base: "linear-gradient(180deg,#15123a 0%,#3a2350 36%,#8a3f55 70%,#e0794a 100%)",
    accent: "radial-gradient(60% 50% at 50% 100%, rgba(255,150,90,.5), transparent 70%)",
    glow: "rgba(190,90,140,.38)", vignette: "radial-gradient(120% 100% at 50% 50%, transparent 52%, rgba(0,0,0,.34))",
    stars: 0.28, globe: "//unpkg.com/three-globe/example/img/earth-day.jpg", atmo: "#ff8f6b", label: "Sunset",
  },
  night: {
    base: "radial-gradient(75% 62% at 50% 42%, #16224d 0%, #0a1230 46%, #05070f 100%)",
    glow: "rgba(91,134,255,.34)", vignette: "radial-gradient(120% 100% at 50% 50%, transparent 48%, rgba(0,0,0,.5))",
    stars: 0.6, globe: "//unpkg.com/three-globe/example/img/earth-night.jpg", atmo: "#5b86ff", label: "Night",
  },
};

// Beams converge on Jerusalem: the reconnection to Israel made visible.
const ISRAEL = { lat: 31.7683, lng: 35.2137 };
// Neon beam gradient: clear at the source, vivid sky-to-violet toward Israel.
const BEAM_COLOR = ["rgba(56,189,248,0)", "rgba(56,189,248,0.85)", "#a78bfa"];

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
  const [beamsOn, setBeamsOn] = useState(true);
  const [bgMode, setBgMode] = useState<"auto" | "day" | "night">("auto");
  const [territory, setTerritory] = useState<string | null>(null);

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
  // Neon beams from each diaspora point to Jerusalem. Each flows at its own
  // pace and starts at a staggered offset so the field feels alive, not pulsing
  // in unison. Points already in Israel are skipped (no beam to themselves).
  const beams = useMemo(() => {
    if (!beamsOn) return [];
    return colored
      .filter((p) => Math.hypot(p.lat - ISRAEL.lat, p.lng - ISRAEL.lng) > 1.2)
      .slice(0, 120)
      .map((p, i) => ({
        startLat: p.lat,
        startLng: p.lng,
        endLat: ISRAEL.lat,
        endLng: ISRAEL.lng,
        color: BEAM_COLOR,
        speed: 2600 + ((i * 137) % 2600),
        gap: ((i * 53) % 100) / 100,
      }));
  }, [colored, beamsOn]);

  // Territories: data-countries with a centroid and their records, for the
  // hover label + lock-on-territory funnel.
  const territories = useMemo(() => {
    const m = new Map<string, { country: string; lat: number; lng: number; n: number; members: typeof colored }>();
    for (const p of colored) {
      if (!p.country) continue;
      const e = m.get(p.country) ?? { country: p.country, lat: 0, lng: 0, n: 0, members: [] as typeof colored };
      e.lat += p.lat;
      e.lng += p.lng;
      e.n += 1;
      e.members.push(p);
      m.set(p.country, e);
    }
    return [...m.values()].map((e) => ({ ...e, lat: e.lat / e.n, lng: e.lng / e.n }));
  }, [colored]);

  const territoryData = useMemo(() => territories.find((t) => t.country === territory) ?? null, [territories, territory]);

  function openTerritory(country: string, lat: number, lng: number) {
    setTerritory(country);
    const g = globeRef.current;
    if (g && g.pointOfView) g.pointOfView({ lat, lng, altitude: 1.6 }, 800);
  }

  const active = fOwner !== "all" || fSegment !== "all" || fCountry !== "all" || fKind !== "all";
  const effPhase: Phase = bgMode === "auto" ? phase : bgMode;
  const ph = PHASE[effPhase];
  const labelInk = effPhase === "day" || effPhase === "dawn" ? "rgba(12,19,32,0.92)" : "rgba(234,240,255,0.96)";

  return (
    <div ref={wrapRef} className="fixed bottom-0 left-56 right-0 top-14 overflow-hidden">
      {/* Layered time-of-day scenery around the globe */}
      <div className="absolute inset-0" style={{ background: ph.base }} />
      {ph.accent && <div className="absolute inset-0" style={{ background: ph.accent }} />}
      {ph.stars > 0 && (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${STARS})`, backgroundSize: "cover", opacity: ph.stars }} />
      )}
      <div className="absolute inset-0" style={{ background: `radial-gradient(42% 42% at 50% 47%, ${ph.glow}, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: ph.vignette }} />

      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
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
          labelsData={territories}
          labelLat="lat"
          labelLng="lng"
          labelText={(d: any) => `${d.country} (${d.n})`}
          labelSize={1.05}
          labelDotRadius={0.45}
          labelColor={() => labelInk}
          labelResolution={2}
          labelLabel={(d: any) => `<div style="font:600 12px/1.2 ui-sans-serif;padding:2px 4px">${d.country}: ${d.n} record${d.n === 1 ? "" : "s"} — click to open</div>`}
          onLabelClick={(d: any) => openTerritory(d.country, d.lat, d.lng)}
          arcsData={beams}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke={0.4}
          arcAltitudeAutoScale={0.45}
          arcDashLength={0.45}
          arcDashGap={1.8}
          arcDashInitialGap={(d: any) => d.gap}
          arcDashAnimateTime={(d: any) => d.speed}
          arcsTransitionDuration={400}
          ringsData={beamsOn && beams.length ? [{ lat: ISRAEL.lat, lng: ISRAEL.lng }] : []}
          ringColor={() => (t: number) => `rgba(167,139,250,${1 - t})`}
          ringMaxRadius={4}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1400}
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

      {/* Territory funnel: locked-on country with its records and actions */}
      {territoryData && (
        <div className="absolute left-6 top-28 w-72">
          <div className="card animate-rise p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="label-eyebrow">Territory</div>
                <div className="text-base font-semibold text-ink">{territoryData.country}</div>
                <div className="text-xs text-ink-muted">{territoryData.n} record{territoryData.n === 1 ? "" : "s"} here</div>
              </div>
              <button onClick={() => setTerritory(null)} className="text-xs text-ink-muted hover:text-ink">Close</button>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {territoryData.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => router.push(m.href)}
                  className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-muted px-2.5 py-1.5 text-left text-sm transition hover:border-primary"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: (m as any).color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{m.name}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">{m.kind}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => router.push(`/organizations/new?country=${encodeURIComponent(territoryData.country)}`)} className="btn-ghost text-xs">
                New org here
              </button>
              <button onClick={() => router.push(`/people/new?country=${encodeURIComponent(territoryData.country)}`)} className="btn-ghost text-xs">
                New person here
              </button>
            </div>
          </div>
        </div>
      )}

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

          <button
            onClick={() => setBeamsOn((v) => !v)}
            title="Neon beams to Israel"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              beamsOn ? "bg-primary text-primary-contrast" : `${Pill}`
            }`}
          >
            Beams
          </button>

          <span className="h-5 w-px bg-line" />

          {/* Backdrop: auto (time of day) / day / night, icons only */}
          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {([
              ["auto", "Auto (time of day)", "M12 3a9 9 0 1 0 0 18V3Z"],
              ["day", "Day", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"],
              ["night", "Night", "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"],
            ] as const).map(([m, title, d]) => (
              <button
                key={m}
                onClick={() => setBgMode(m)}
                title={title}
                className={`px-2.5 py-1.5 transition ${bgMode === m ? "bg-primary text-primary-contrast" : "text-ink-soft hover:bg-surface-muted"}`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

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
