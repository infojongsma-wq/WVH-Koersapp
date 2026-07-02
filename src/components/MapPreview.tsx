"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix default marker icons for bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  coordinates?: [number, number][]; // [lon, lat]
  startLat?: number | null;
  startLon?: number | null;
};

function validLatLon(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

export default function MapPreview({ coordinates, startLat, startLon }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Convert stored [lon, lat] → Leaflet's [lat, lon], filter anything invalid.
    const latlngs: [number, number][] = (coordinates ?? [])
      .map(([lon, lat]): [number, number] => [lat, lon])
      .filter(([lat, lon]) => validLatLon(lat, lon));

    const holten: [number, number] = [52.2917, 6.4222];
    const fallback: [number, number] =
      startLat != null && startLon != null && validLatLon(startLat, startLon)
        ? [startLat, startLon]
        : holten;
    const center = latlngs[0] ?? fallback;

    const map = L.map(divRef.current).setView(center, 11);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (latlngs.length > 0) {
      L.polyline(latlngs, { color: "#0A0A0A", weight: 4 }).addTo(map);
      L.marker(latlngs[0]).addTo(map);
      if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20] });
      }
    } else {
      L.marker(center).addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, startLat, startLon]);

  return (
    <div
      ref={divRef}
      className="h-64 md:h-80 rounded-xl overflow-hidden border border-cream-200"
    />
  );
}
