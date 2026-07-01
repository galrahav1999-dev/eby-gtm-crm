"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { feature } from "topojson-client";
import { ownerColor } from "@/lib/colors";
import { OwnerAvatar } from "./ui";

// Parse an owner color to [r,g,b] so pulsing rings can fade in that hue. Owners
// use hex; anything else falls back to the beam violet.
function toRgb(c: string): [number, number, number] {
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const v = parseInt(n, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  return [167, 139, 250];
}

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export interface GlobePoint {
  id: string;
  kind: "org" | "person";
  name: string;
  label: string;
  owner: string | null;
  segment: string | null;
  country: string | null;
  city: string | null;
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
  funnel: { stage: string; count: number }[];
}

type Phase = "dawn" | "day" | "dusk" | "night";
function currentPhase(): Phase {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 18) return "day";
  if (h >= 18 && h < 20) return "dusk";
  return "night";
}
interface PhaseDef {
  base: string;
  accent?: string;
  glow: string;
  vignette: string;
  stars: number;
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
const BEAM_COLOR = ["rgba(56,189,248,0)", "rgba(56,189,248,0.9)", "#a78bfa"];

// Map a world-atlas country shape to the short country value EBY records use.
const POLY_NAME_TO_EBY: Record<string, string> = {
  "United States of America": "USA",
  "United Kingdom": "UK",
  France: "France",
  Canada: "Canada",
  Argentina: "Argentina",
  Australia: "Australia",
  Israel: "Israel",
};
const POLY = {
  capEmpty: "rgba(255,255,255,0.015)",
  capHas: "rgba(56,189,248,0.10)",
  capHover: "rgba(124,108,250,0.5)",
  capLocked: "rgba(124,108,250,0.26)",
  side: "rgba(120,160,255,0.12)",
  stroke: "rgba(150,170,220,0.14)",
  strokeHot: "rgba(56,189,248,0.95)",
};

const ALT = { world: 2.5, country: 1.05, city: 0.5 };

// A glowing Star of David marker (two overlapping triangles) in the owner's
// color, built as a plain DOM element for react-globe's HTML layer. No custom
// three.js objects, so it cannot blank the canvas.
function makeStarEl(d: any, onClick: () => void): HTMLElement {
  const el = document.createElement("div");
  el.style.pointerEvents = "auto";
  el.style.cursor = "pointer";
  el.title = `${d.name} · ${d.kind === "org" ? "Organization" : "Person"}${d.owner ? " · " + d.owner : ""} · click to open`;
  el.innerHTML =
    `<div style="transition:transform .18s ease;transform-origin:center;">` +
    `<svg width="22" height="22" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 0 3px ${d.color}) drop-shadow(0 0 9px ${d.color});">` +
    `<path d="M12 2.2 L21.3 18.3 L2.7 18.3 Z" fill="${d.color}" fill-opacity="0.22" stroke="${d.color}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M12 21.8 L2.7 5.7 L21.3 5.7 Z" fill="${d.color}" fill-opacity="0.22" stroke="${d.color}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg></div>`;
  const inner = el.firstElementChild as HTMLElement;
  el.onmouseenter = () => { inner.style.transform = "scale(1.5)"; };
  el.onmouseleave = () => { inner.style.transform = "scale(1)"; };
  el.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return el;
}

function tooltip(title: string, lines: string[]) {
  return `<div style="font-family:ui-sans-serif,system-ui;background:rgba(10,15,30,0.92);border:1px solid rgba(255,255,255,0.12);padding:8px 11px;border-radius:11px;color:#eaf0ff;font-size:12px;backdrop-filter:blur(8px);box-shadow:0 10px 34px rgba(0,0,0,0.5)">
    <div style="font-weight:600">${title}</div>${lines.map((l) => `<div style="color:#9fb0d6;margin-top:1px">${l}</div>`).join("")}</div>`;
}

const Pill =
  "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft outline-none transition hover:text-ink";

type Level = "world" | "country" | "city";
interface Agg {
  key: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  owner: string | null;
}

function dominant(owners: Map<string, number>): string | null {
  let best: string | null = null;
  let n = -1;
  for (const [o, c] of owners) if (c > n) ((n = c), (best = o));
  return best;
}

export function GlobeHome({ points, stats }: { points: GlobePoint[]; stats: Stats }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 900, h: 700 });
  const [phase, setPhase] = useState<Phase>("day");
  const [bgMode, setBgMode] = useState<"auto" | "day" | "night">("auto");
  const [fOwner, setFOwner] = useState("all");
  const [fKind, setFKind] = useState<"all" | "org" | "person">("all");
  const [beamsOn, setBeamsOn] = useState(true);
  const [statsOpen, setStatsOpen] = useState(true);
  const [polys, setPolys] = useState<any[]>([]);
  const [hoverPoly, setHoverPoly] = useState<any>(null);

  const [level, setLevel] = useState<Level>("world");
  const [selCountry, setSelCountry] = useState<string | null>(null);
  const [selCity, setSelCity] = useState<string | null>(null);

  useEffect(() => setPhase(currentPhase()), []);
  useEffect(() => {
    let alive = true;
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const fc: any = feature(topo, topo.objects.countries);
        if (alive) setPolys(fc.features ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => {
      const r = e[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(
    () => points.filter((p) => (fOwner === "all" || p.owner === fOwner) && (fKind === "all" || p.kind === fKind)),
    [points, fOwner, fKind]
  );

  const ownerCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of points) if (p.owner) m.set(p.owner, (m.get(p.owner) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [points]);

  // The records shown on the globe at the current level (individual dots).
  const shown = useMemo(() => {
    if (level === "world") return filtered;
    if (level === "country") return filtered.filter((p) => p.country === selCountry);
    return filtered.filter((p) => p.country === selCountry && (p.city || "Unspecified") === selCity);
  }, [filtered, level, selCountry, selCity]);

  const colored = useMemo(() => shown.map((p) => ({ ...p, color: ownerColor(p.owner) })), [shown]);

  // Country centroids (for the polygon drill + camera flight).
  const countryAgg = useMemo<Agg[]>(() => {
    const m = new Map<string, { lat: number; lng: number; n: number; owners: Map<string, number> }>();
    for (const p of filtered) {
      if (!p.country) continue;
      const e = m.get(p.country) ?? { lat: 0, lng: 0, n: 0, owners: new Map() };
      e.lat += p.lat; e.lng += p.lng; e.n += 1;
      if (p.owner) e.owners.set(p.owner, (e.owners.get(p.owner) ?? 0) + 1);
      m.set(p.country, e);
    }
    return [...m.entries()].map(([key, e]) => ({ key, name: key, lat: e.lat / e.n, lng: e.lng / e.n, value: e.n, owner: dominant(e.owners) }));
  }, [filtered]);

  // Cities within the selected country (for the drill panel + camera flight).
  const cityAgg = useMemo<Agg[]>(() => {
    if (!selCountry) return [];
    const m = new Map<string, { lat: number; lng: number; n: number; owners: Map<string, number> }>();
    for (const p of filtered) {
      if (p.country !== selCountry) continue;
      const city = p.city || "Unspecified";
      const e = m.get(city) ?? { lat: 0, lng: 0, n: 0, owners: new Map() };
      e.lat += p.lat; e.lng += p.lng; e.n += 1;
      if (p.owner) e.owners.set(p.owner, (e.owners.get(p.owner) ?? 0) + 1);
      m.set(city, e);
    }
    return [...m.entries()]
      .map(([key, e]) => ({ key, name: key, lat: e.lat / e.n, lng: e.lng / e.n, value: e.n, owner: dominant(e.owners) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, selCountry]);

  const dataCountrySet = useMemo(() => new Set(countryAgg.map((c) => c.key)), [countryAgg]);

  // Animated flying beams to Jerusalem, world level only. Each flows at its own
  // pace and starts at a staggered offset so the field feels alive.
  const beams = useMemo(() => {
    if (!beamsOn || level !== "world") return [];
    return colored
      .filter((p) => Math.hypot(p.lat - ISRAEL.lat, p.lng - ISRAEL.lng) > 1.2)
      .slice(0, 160)
      .map((p, i) => ({
        startLat: p.lat, startLng: p.lng, endLat: ISRAEL.lat, endLng: ISRAEL.lng,
        color: BEAM_COLOR, speed: 2600 + ((i * 137) % 2600), gap: ((i * 53) % 100) / 100,
      }));
  }, [colored, beamsOn, level]);

  // A pulsing halo on every record (owner colored), plus the Jerusalem pulse.
  // This gives the "alive" glow using react-globe's native rings, no custom
  // three.js objects (which risk a second three instance and a blank canvas).
  const rings = useMemo(() => {
    const pts: { lat: number; lng: number; rgb: [number, number, number]; max: number; period: number }[] = [];
    for (const p of colored) {
      const rgb = toRgb(p.color);
      // Two staggered rings per record: a quick inner pulse and a slow wide one,
      // so each marker reads as a living sonar beacon, not a plain dot.
      pts.push({ lat: p.lat, lng: p.lng, rgb, max: 1.1, period: 1100 });
      pts.push({ lat: p.lat, lng: p.lng, rgb, max: 2.6, period: 2300 });
    }
    if (beamsOn && level === "world") pts.push({ lat: ISRAEL.lat, lng: ISRAEL.lng, rgb: [167, 139, 250], max: 4, period: 1400 });
    return pts;
  }, [colored, beamsOn, level]);

  // Camera flights are fired directly from the click handlers (not an effect),
  // so the zoom always plays even if a render hiccups.
  function flyTo(lat: number, lng: number, altitude: number) {
    const g = globeRef.current;
    if (!g || !g.pointOfView) return;
    if (g.controls) g.controls().autoRotate = false;
    g.pointOfView({ lat, lng, altitude }, 1100);
  }

  // Auto-rotation only at the world level; it locks once you drill in.
  useEffect(() => {
    const g = globeRef.current;
    if (g && g.controls) {
      g.controls().autoRotate = level === "world";
      g.controls().autoRotateSpeed = 0.35;
      g.controls().enableZoom = true;
    }
  });

  function drillToCountry(country: string) {
    if (!dataCountrySet.has(country)) return;
    const c = countryAgg.find((x) => x.key === country);
    setHoverPoly(null);
    setSelCountry(country);
    setSelCity(null);
    setLevel("country");
    if (c) flyTo(c.lat, c.lng, ALT.country);
  }
  function drillToCity(city: string) {
    const c = cityAgg.find((x) => x.key === city);
    setSelCity(city);
    setLevel("city");
    if (c) flyTo(c.lat, c.lng, ALT.city);
  }
  // The last step of the funnel: fly the camera down to the record, then open
  // its card once the flight has settled.
  function openRecord(p: { lat: number; lng: number; href: string }) {
    const g = globeRef.current;
    if (g && g.pointOfView) {
      g.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.32 }, 650);
      window.setTimeout(() => router.push(p.href), 680);
    } else {
      router.push(p.href);
    }
  }
  function drillUp() {
    if (level === "city") {
      setSelCity(null);
      setLevel("country");
      const c = selCountry ? countryAgg.find((x) => x.key === selCountry) : null;
      if (c) flyTo(c.lat, c.lng, ALT.country);
    } else if (level === "country") {
      setSelCountry(null);
      setLevel("world");
      const g = globeRef.current;
      if (g && g.pointOfView) {
        const cur = g.pointOfView();
        g.pointOfView({ lat: 18, lng: cur?.lng ?? -30, altitude: ALT.world }, 1100);
      }
    }
  }

  // Escape backs out one level.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && level !== "world") drillUp();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const effPhase: Phase = bgMode === "auto" ? phase : bgMode;
  const ph = PHASE[effPhase];
  const active = fOwner !== "all" || fKind !== "all";
  const hoverEby = hoverPoly ? POLY_NAME_TO_EBY[hoverPoly?.properties?.name] : null;

  const locLabel = level === "city" ? `${selCity} · ${selCountry}` : level === "country" ? selCountry : "Worldwide";
  const backLabel = level === "city" ? selCountry : "the world";

  return (
    <div ref={wrapRef} className="fixed bottom-0 left-56 right-0 top-14 overflow-hidden">
      <div className="absolute inset-0" style={{ background: ph.base }} />
      {ph.accent && <div className="absolute inset-0" style={{ background: ph.accent }} />}
      {ph.stars > 0 && <div className="absolute inset-0" style={{ backgroundImage: `url(${STARS})`, backgroundSize: "cover", opacity: ph.stars }} />}
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
          // Country shapes: hover + click to drill at world; once you drill in,
          // only the selected country stays rendered, lifted and highlighted, so
          // the view is clearly locked onto that territory.
          polygonsData={level === "world" ? polys : polys.filter((p: any) => POLY_NAME_TO_EBY[p?.properties?.name] === selCountry)}
          polygonAltitude={(d: any) => (level !== "world" ? 0.06 : d === hoverPoly ? 0.06 : 0.01)}
          polygonCapColor={(d: any) => {
            if (level !== "world") return POLY.capLocked;
            const eby = POLY_NAME_TO_EBY[d?.properties?.name];
            if (d === hoverPoly) return POLY.capHover;
            if (eby && dataCountrySet.has(eby)) return POLY.capHas;
            return POLY.capEmpty;
          }}
          polygonSideColor={() => POLY.side}
          polygonStrokeColor={(d: any) => (level !== "world" || d === hoverPoly ? POLY.strokeHot : POLY.stroke)}
          polygonsTransitionDuration={0}
          onPolygonHover={(p: any) => level === "world" && setHoverPoly(p || null)}
          onPolygonClick={(d: any) => {
            if (level !== "world") return;
            const eby = POLY_NAME_TO_EBY[d?.properties?.name];
            if (eby) drillToCountry(eby);
          }}
          polygonLabel={(d: any) => {
            if (level !== "world") return "";
            const eby = POLY_NAME_TO_EBY[d?.properties?.name];
            const c = eby ? countryAgg.find((n) => n.key === eby) : null;
            return tooltip(d?.properties?.name ?? "", [c ? `${c.value} record${c.value === 1 ? "" : "s"} · click to zoom in` : "No records here"]);
          }}
          // Glowing Star of David markers, colored by owner. They grow on hover
          // and click-through to the record; the sonar rings below keep them alive.
          htmlElementsData={colored as object[]}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.008}
          htmlElement={(d: any) => makeStarEl(d, () => openRecord(d))}
          htmlTransitionDuration={0}
          // Animated flying beams to Jerusalem (world level).
          arcsData={beams}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke={0.5}
          arcAltitudeAutoScale={0.45}
          arcDashLength={0.45}
          arcDashGap={1.8}
          arcDashInitialGap={(d: any) => d.gap}
          arcDashAnimateTime={(d: any) => d.speed}
          arcsTransitionDuration={400}
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d: any) => (t: number) => `rgba(${d.rgb[0]},${d.rgb[1]},${d.rgb[2]},${1 - t})`}
          ringMaxRadius={(d: any) => d.max}
          ringPropagationSpeed={1.8}
          ringRepeatPeriod={(d: any) => d.period}
        />
      </div>

      {/* Location nav (top-left) */}
      <div className="absolute left-6 top-5">
        <div className="glass inline-flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card">
          {level !== "world" && (
            <button onClick={drillUp} title={`Back to ${backLabel}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-soft transition hover:text-ink">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">EBY · Mission control</span>
            <span className="text-[19px] font-semibold leading-tight text-ink">{locLabel === "Worldwide" ? "The world we are reconnecting" : locLabel}</span>
            <span className="text-xs text-ink-muted">
              {ph.label} · {level === "world" ? `${shown.length} of ${stats.total} shown` : level === "country" ? "pick a city, or click a dot to open" : "click a dot to open"}
            </span>
          </div>
        </div>
      </div>

      {/* Back button (top-center) */}
      {level !== "world" && (
        <div className="absolute left-1/2 top-5 -translate-x-1/2">
          <button onClick={drillUp} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink shadow-card">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to {backLabel}
            <kbd className="ml-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-soft">Esc</kbd>
          </button>
        </div>
      )}

      {/* Snapshot (world only) */}
      {level === "world" && (
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
              {stats.deals > 0 && (
                <div className="mt-3 border-t border-line-soft pt-3">
                  <div className="label-eyebrow mb-1.5">Deals by stage</div>
                  <div className="space-y-1.5">
                    {stats.funnel.map((f) => {
                      const max = Math.max(1, ...stats.funnel.map((x) => x.count));
                      return (
                        <div key={f.stage} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 truncate text-[11px] text-ink-muted" title={f.stage}>{f.stage.replace(/^\d+\s*/, "")}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(4, (f.count / max) * 100)}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
                          </div>
                          <span className="w-4 shrink-0 text-right text-[11px] font-medium text-ink-soft">{f.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <button onClick={() => router.push("/dashboard")} className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline">
                Open full dashboard →
              </button>
            </div>
          ) : (
            <button onClick={() => setStatsOpen(true)} className="btn-ghost bg-card text-xs">Snapshot</button>
          )}
        </div>
      )}

      {/* Drill panel (country / city) */}
      {level !== "world" && (
        <div className="absolute right-6 top-5 flex max-h-[calc(100%-8rem)] w-72 flex-col">
          <div className="card flex min-h-0 flex-col overflow-hidden p-0">
            <div className="border-b border-line-soft px-4 py-3">
              <div className="label-eyebrow">{level === "country" ? "Cities in" : "Records in"}</div>
              <div className="text-sm font-semibold text-ink">{level === "country" ? selCountry : selCity}</div>
              <div className="mt-0.5 text-[11px] text-ink-muted">
                {level === "country" ? `${cityAgg.length} cit${cityAgg.length === 1 ? "y" : "ies"} · click to zoom in` : `${shown.length} record${shown.length === 1 ? "" : "s"} · click to open`}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {level === "country"
                ? cityAgg.map((c) => (
                    <button key={c.key} onClick={() => drillToCity(c.key)} className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-surface-muted">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ownerColor(c.owner), boxShadow: `0 0 6px ${ownerColor(c.owner)}` }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{c.name}</div>
                        <div className="text-[11px] text-ink-muted">{c.value} record{c.value === 1 ? "" : "s"}</div>
                      </div>
                      <Chevron />
                    </button>
                  ))
                : shown.map((p) => (
                    <button key={p.id} onClick={() => openRecord(p)} className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-surface-muted">
                      <OwnerAvatar owner={p.owner} size={22} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                        <div className="text-[11px] text-ink-muted">{p.kind === "org" ? "Organization" : "Person"}</div>
                      </div>
                      <Chevron />
                    </button>
                  ))}
              {(level === "country" ? cityAgg.length : shown.length) === 0 && (
                <div className="px-3 py-6 text-center text-sm text-ink-muted">Nothing here yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Country hover hint (world) */}
      {level === "world" && hoverPoly && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm shadow-card">
            <span className="font-medium text-ink">{hoverPoly?.properties?.name}</span>
            {hoverEby && dataCountrySet.has(hoverEby) ? <span className="text-primary">click to zoom in</span> : <span className="text-ink-muted">no records here</span>}
          </div>
        </div>
      )}

      {/* Owner legend (bottom-right) */}
      {ownerCounts.length > 0 && (
        <div className="pointer-events-none absolute bottom-6 right-6">
          <div className="glass rounded-xl px-3 py-2.5 shadow-card">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Team</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {ownerCounts.map(([owner]) => (
                <span key={owner} className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <span className="h-2 w-2 rounded-full" style={{ background: ownerColor(owner), boxShadow: `0 0 6px ${ownerColor(owner)}` }} />
                  {owner}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control dock (bottom-center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="glass flex flex-wrap items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-pop">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Book</span>
          <button onClick={() => setFOwner("all")} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${fOwner === "all" ? "bg-primary text-primary-contrast" : Pill}`}>
            Whole team
          </button>
          <div className="flex items-center gap-1">
            {ownerCounts.map(([owner]) => {
              const on = fOwner === owner;
              return (
                <button key={owner} title={owner} onClick={() => setFOwner(on ? "all" : owner)} className={`rounded-full p-0.5 transition ${on ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}>
                  <OwnerAvatar owner={owner} size={24} />
                </button>
              );
            })}
          </div>

          <span className="h-5 w-px bg-line" />

          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {([["all", "All"], ["org", "Orgs"], ["person", "People"]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setFKind(k)} className={`px-3 py-1.5 text-xs font-medium transition ${fKind === k ? "bg-primary text-primary-contrast" : "text-ink-soft hover:bg-surface-muted"}`}>
                {lbl}
              </button>
            ))}
          </div>

          <button onClick={() => setBeamsOn((v) => !v)} title="Animated beams to Jerusalem" className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${beamsOn ? "bg-primary text-primary-contrast" : Pill}`}>
            Beams
          </button>

          <span className="h-5 w-px bg-line" />

          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {([
              ["auto", "Auto (time of day)", "M12 3a9 9 0 1 0 0 18V3Z"],
              ["day", "Day", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"],
              ["night", "Night", "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"],
            ] as const).map(([m, title, d]) => (
              <button key={m} onClick={() => setBgMode(m)} title={title} className={`px-2.5 py-1.5 transition ${bgMode === m ? "bg-primary text-primary-contrast" : "text-ink-soft hover:bg-surface-muted"}`}>
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

          {active && (
            <button onClick={() => { setFOwner("all"); setFKind("all"); }} className={Pill}>Clear</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-muted group-hover:text-ink-soft" fill="none">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
