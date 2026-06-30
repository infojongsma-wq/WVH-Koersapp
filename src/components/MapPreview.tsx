"use client";

import { MapContainer, Polyline, TileLayer, Marker } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// Fix Leaflet default marker icons (Next bundling)
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

export default function MapPreview({ coordinates, startLat, startLon }: Props) {
  // Convert [lon,lat] -> [lat,lon] for Leaflet
  const latlngs: [number, number][] = (coordinates ?? []).map(
    ([lon, lat]) => [lat, lon]
  );
  const start = latlngs[0];
  const center: [number, number] =
    start ??
    (startLat != null && startLon != null
      ? [startLat, startLon]
      : [52.2917, 6.4222]);

  return (
    <div className="h-64 md:h-80 rounded-xl overflow-hidden border">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
        />
        {latlngs.length > 0 && (
          <Polyline positions={latlngs} pathOptions={{ color: "#0b3d91", weight: 4 }} />
        )}
        {latlngs.length > 0 && <Marker position={latlngs[0]} />}
        <FitBounds points={latlngs} />
      </MapContainer>
    </div>
  );
}

import { useMap } from "react-leaflet";
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [points, map]);
  return null;
}
