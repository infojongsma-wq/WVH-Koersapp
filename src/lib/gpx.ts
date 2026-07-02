// GPX -> array of [lon, lat] points using @tmcw/togeojson + @xmldom/xmldom.
// Adds defensive validation + auto-swap when the file has coords stored
// as [lat, lon] instead of the GeoJSON standard [lon, lat].

import { DOMParser } from "@xmldom/xmldom";
import { gpx as gpxToGeoJson } from "@tmcw/togeojson";

export type GpxRoute = {
  coordinates: [number, number][]; // [lon, lat]
  distanceKm?: number;
};

// Reasonable bounding box for the whole planet: |lon| <= 180, |lat| <= 90.
function isValidPair([a, b]: [number, number]): boolean {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a) <= 180 &&
    Math.abs(b) <= 90
  );
}

// Europe + Netherlands sanity bounding box. Used to decide whether a pair
// looks more like [lon, lat] or [lat, lon] when both orderings are technically valid.
function inEurope([lon, lat]: [number, number]): boolean {
  return lon >= -25 && lon <= 45 && lat >= 30 && lat <= 72;
}

function normalize(rawCoords: [number, number][]): [number, number][] {
  if (rawCoords.length === 0) return rawCoords;

  // Sample a few points to figure out order.
  const samples = [
    rawCoords[0],
    rawCoords[Math.floor(rawCoords.length / 2)],
    rawCoords[rawCoords.length - 1],
  ];

  let asIsScore = 0;
  let swappedScore = 0;
  for (const [a, b] of samples) {
    if (isValidPair([a, b]) && inEurope([a, b])) asIsScore++;
    if (isValidPair([b, a]) && inEurope([b, a])) swappedScore++;
  }

  const shouldSwap = swappedScore > asIsScore;
  const oriented = shouldSwap
    ? rawCoords.map(([a, b]) => [b, a] as [number, number])
    : rawCoords;

  // Drop anything that's still invalid (out-of-range) to avoid crashing Leaflet.
  return oriented.filter(isValidPair);
}

export function parseGpx(xml: string): GpxRoute | null {
  try {
    const dom = new DOMParser().parseFromString(xml, "text/xml");
    const geo = gpxToGeoJson(dom as unknown as Document);
    if (!geo || !geo.features) return null;

    const raw: [number, number][] = [];
    for (const feature of geo.features) {
      const g = feature.geometry as
        | { type?: string; coordinates?: unknown }
        | null;
      if (!g) continue;
      if (g.type === "LineString" && Array.isArray(g.coordinates)) {
        for (const c of g.coordinates as [number, number][]) {
          raw.push([Number(c[0]), Number(c[1])]);
        }
      } else if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
        for (const line of g.coordinates as [number, number][][]) {
          for (const c of line) raw.push([Number(c[0]), Number(c[1])]);
        }
      } else if (g.type === "Point" && Array.isArray(g.coordinates)) {
        const c = g.coordinates as [number, number];
        raw.push([Number(c[0]), Number(c[1])]);
      }
    }

    const coords = normalize(raw);
    if (coords.length === 0) return null;
    return { coordinates: coords };
  } catch {
    return null;
  }
}
