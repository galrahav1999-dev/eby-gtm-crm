"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  href: string;
  kind: "org" | "person";
}

export function WorldMap({ points }: { points: MapPoint[] }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="card relative h-[560px] overflow-hidden">
      <Globe
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="#6366f1"
        atmosphereAltitude={0.18}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.04}
        pointRadius={0.5}
        pointLabel={(d: any) => `<div style="font-size:12px">${d.label}</div>`}
        onPointClick={(d: any) => router.push(d.href)}
        pointsMerge={false}
      />
      <div className="pointer-events-none absolute left-4 top-4 flex gap-3 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} /> Organizations
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#f472b6" }} /> People
        </span>
      </div>
    </div>
  );
}
