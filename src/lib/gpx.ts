// GPX -> GeoJSON conversion using @tmcw/togeojson + xmldom
// Used server-side to extract route points; the map renders them with Leaflet.

import { DOMParser } from "@xmldom/xmldom";
import { gpx as gpxToGeoJson } from "@tmcw/togeojson";

export type GpxRoute = {
  coordinates: [number, number][]; // [lon, lat]
  distanceKm?: number;
};

export function parseGpx(xml: string): GpxRoute | null {
  try {
    const dom = new DOMParser().parseFromString(xml, "text/xml");
    const geo = gpxToGeoJson(dom as unknown as Document);
    if (!geo || !geo.features) return null;
    const coords: [number, number][] = [];
    for (const feature of geo.features) {
      const g = feature.geometry as { type?: string; coordinates?: unknown } | null;
      if (!g) continue;
      if (g.type === "LineString" && Array.isArray(g.coordinates)) {
        for (const c of g.coordinates as [number, number][]) {
          coords.push([c[0], c[1]]);
        }
      } else if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
        for (const line of g.coordinates as [number, number][][]) {
          for (const c of line) coords.push([c[0], c[1]]);
        }
      }
    }
    if (coords.length === 0) return null;
    return { coordinates: coords };
  } catch {
    return null;
  }
}
