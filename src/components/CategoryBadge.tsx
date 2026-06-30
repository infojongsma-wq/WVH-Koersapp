import { categoryMeta } from "@/lib/constants";

export function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMeta(category);
  if (!meta) return <span>{category}</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
