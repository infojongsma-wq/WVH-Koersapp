// Open-Meteo: gratis, geen key. Forecast up to 16 days ahead.
// Docs: https://open-meteo.com/en/docs

const COMPASS = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
export function degToCompass(deg: number): string {
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return COMPASS[idx];
}

export type WeatherSnapshot = {
  summary: string;
  tempC: number;
  windDirection: string; // compass
  windSpeedKmh: number;
  raw: unknown;
};

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Helder",
  1: "Overwegend helder",
  2: "Half bewolkt",
  3: "Bewolkt",
  45: "Mist",
  48: "Aanvriezende mist",
  51: "Lichte motregen",
  53: "Motregen",
  55: "Stevige motregen",
  61: "Lichte regen",
  63: "Regen",
  65: "Stevige regen",
  71: "Lichte sneeuw",
  73: "Sneeuw",
  75: "Hevige sneeuw",
  80: "Lichte buien",
  81: "Buien",
  82: "Stevige buien",
  95: "Onweersbui",
  96: "Onweer met hagel",
  99: "Zwaar onweer",
};

export async function fetchWeatherForRide(opts: {
  lat: number;
  lon: number;
  datetime: Date;
}): Promise<WeatherSnapshot | null> {
  const { lat, lon, datetime } = opts;
  const now = new Date();
  const daysAhead = (datetime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  // Open-Meteo forecast goes up to 16 days
  if (daysAhead > 16 || daysAhead < -1) return null;

  const hour = datetime.toISOString().slice(0, 13) + ":00"; // YYYY-MM-DDTHH:00
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "hourly",
    "temperature_2m,weathercode,windspeed_10m,winddirection_10m"
  );
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("forecast_days", "16");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hourly?: {
        time: string[];
        temperature_2m: number[];
        weathercode: number[];
        windspeed_10m: number[];
        winddirection_10m: number[];
      };
    };
    const hourly = data.hourly;
    if (!hourly) return null;
    // Find nearest hour
    const target = hour.replace("Z", "");
    let idx = hourly.time.findIndex((t) => t.startsWith(target.slice(0, 13)));
    if (idx === -1) {
      // fallback: nearest in time
      const targetMs = datetime.getTime();
      let best = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < hourly.time.length; i++) {
        const diff = Math.abs(new Date(hourly.time[i]).getTime() - targetMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = i;
        }
      }
      idx = best;
    }
    const code = hourly.weathercode[idx];
    return {
      summary: WMO_DESCRIPTIONS[code] ?? `Code ${code}`,
      tempC: hourly.temperature_2m[idx],
      windSpeedKmh: hourly.windspeed_10m[idx],
      windDirection: degToCompass(hourly.winddirection_10m[idx]),
      raw: { idx, code },
    };
  } catch {
    return null;
  }
}

export async function geocodeLocation(q: string): Promise<{ lat: number; lon: number } | null> {
  if (!q.trim()) return null;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "nl");
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { latitude: number; longitude: number }[];
    };
    const first = data.results?.[0];
    if (!first) return null;
    return { lat: first.latitude, lon: first.longitude };
  } catch {
    return null;
  }
}
