export type Category = "RACE" | "GRAVEL" | "MTB" | "EVENT";
export type Level = "A" | "AB" | "B" | "C" | "D" | "VROUWEN";

export const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "RACE", label: "Race", emoji: "🚴" },
  { value: "GRAVEL", label: "Gravel", emoji: "🪨" },
  { value: "MTB", label: "MTB", emoji: "🚵" },
  { value: "EVENT", label: "Evenement / toertocht", emoji: "🎉" },
];

export const LEVELS: {
  value: Level;
  label: string;
  speedRange: string;
  color: string; // tailwind background classes
  textColor: string;
}[] = [
  { value: "A", label: "A-rijders", speedRange: "33+ km/u", color: "bg-zinc-900", textColor: "text-white" },
  { value: "AB", label: "A/B-rijders", speedRange: "32–33 km/u", color: "bg-red-600", textColor: "text-white" },
  { value: "B", label: "B-rijders", speedRange: "30–32 km/u", color: "bg-orange-500", textColor: "text-white" },
  { value: "C", label: "C-rijders", speedRange: "27–30 km/u", color: "bg-yellow-400", textColor: "text-zinc-900" },
  { value: "D", label: "D-rijders", speedRange: "25 km/u", color: "bg-green-500", textColor: "text-white" },
  { value: "VROUWEN", label: "Vrouwen", speedRange: "25–28 km/u", color: "bg-purple-600", textColor: "text-white" },
];

export function levelMeta(value: string) {
  return LEVELS.find((l) => l.value === value);
}

export function categoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value);
}

export const DEFAULT_START_LOCATION = "WVH Aaltinksweg, Holten";
// Approx coords for Holten centre — used when start location is the default
export const DEFAULT_START_COORDS = { lat: 52.2917, lon: 6.4222 };
export const MAX_PARTICIPANTS = 14;
