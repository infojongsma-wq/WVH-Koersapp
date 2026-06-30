import { levelMeta } from "@/lib/constants";

export function LevelBadge({ level }: { level: string }) {
  const meta = levelMeta(level);
  if (!meta) return <span>{level}</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${meta.color} ${meta.textColor}`}
      title={meta.speedRange}
    >
      {meta.label}
    </span>
  );
}
