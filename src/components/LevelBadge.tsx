import { levelMeta } from "@/lib/constants";

export function LevelBadge({ level }: { level: string }) {
  const meta = levelMeta(level);
  if (!meta) return <span>{level}</span>;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-semibold tracking-wide ${meta.color} ${meta.textColor}`}
      title={meta.speedRange}
    >
      {meta.label}
    </span>
  );
}
