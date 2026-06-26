/**
 * Lightweight place -> coordinates lookup so records can be plotted on the globe
 * without any paid geocoding API. City match wins; otherwise country centroid.
 * Unknown places return null (skipped on the map).
 */

const CITIES: Record<string, [number, number]> = {
  "new york": [40.71, -74.0],
  nyc: [40.71, -74.0],
  chicago: [41.88, -87.63],
  "los angeles": [34.05, -118.24],
  ct: [41.6, -72.7],
  connecticut: [41.6, -72.7],
  arizona: [34.0, -111.1],
  london: [51.51, -0.13],
  paris: [48.85, 2.35],
  munich: [48.14, 11.58],
  jerusalem: [31.78, 35.21],
  "tel aviv": [32.08, 34.78],
  "buenos aires": [-34.6, -58.4],
  toronto: [43.65, -79.38],
  sydney: [-33.87, 151.21],
};

const COUNTRIES: Record<string, [number, number]> = {
  usa: [39.8, -98.6],
  uk: [54.0, -2.5],
  france: [46.6, 2.2],
  canada: [56.1, -106.3],
  argentina: [-38.4, -63.6],
  australia: [-25.3, 133.8],
  israel: [31.4, 34.9],
  other: [20.0, 10.0],
};

export function resolveCoords(
  country: string | null | undefined,
  city: string | null | undefined
): { lat: number; lng: number } | null {
  if (city) {
    const c = CITIES[city.trim().toLowerCase()];
    if (c) return { lat: c[0], lng: c[1] };
  }
  if (country) {
    const c = COUNTRIES[country.trim().toLowerCase()];
    if (c) return { lat: c[0], lng: c[1] };
  }
  return null;
}

/** Small deterministic jitter so multiple pins in one place fan out a little. */
export function jitter(seed: string, amount = 1.4): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  const a = (h % 360) * (Math.PI / 180);
  const r = ((h % 100) / 100) * amount;
  return { dLat: Math.sin(a) * r, dLng: Math.cos(a) * r };
}
