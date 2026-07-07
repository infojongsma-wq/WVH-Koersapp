import { categoryMeta } from "@/lib/constants";

export function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMeta(category);
  if (!meta) return <span>{category}</span>;
  return (
    <span className="chip">
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
