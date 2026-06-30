import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LevelBadge } from "@/components/LevelBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatDateNL } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  minKm?: string;
  maxKm?: string;
  wind?: string;
  category?: string;
  level?: string;
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (sp.category) where.category = sp.category;
  if (sp.level) where.level = sp.level;
  if (sp.wind) where.windDirection = sp.wind;

  const minKm = sp.minKm ? Number(sp.minKm) : undefined;
  const maxKm = sp.maxKm ? Number(sp.maxKm) : undefined;
  if (minKm != null || maxKm != null) {
    where.distanceKm = {
      ...(minKm != null && !Number.isNaN(minKm) ? { gte: minKm } : {}),
      ...(maxKm != null && !Number.isNaN(maxKm) ? { lte: maxKm } : {}),
    };
  }
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { description: { contains: sp.q } },
      { captainName: { contains: sp.q } },
    ];
  }

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { datetime: "desc" },
    include: { _count: { select: { participations: true, comments: true } } },
    take: 300,
  });

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">Rittenbibliotheek</h1>
      <p className="text-zinc-500 mb-4 text-sm">
        Alle ritten (toekomst + verleden). Gebruik de filters om te zoeken.
      </p>

      <form
        method="get"
        className="bg-white rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3"
      >
        <label className="md:col-span-2 block">
          <span className="text-xs text-zinc-500">Zoek (naam, kapitein, omschrijving)</span>
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm mt-0.5"
            placeholder="bijv. Sallandse heuvelrug"
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-500">Min km</span>
          <input
            type="number"
            name="minKm"
            defaultValue={sp.minKm ?? ""}
            className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm mt-0.5"
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-500">Max km</span>
          <input
            type="number"
            name="maxKm"
            defaultValue={sp.maxKm ?? ""}
            className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm mt-0.5"
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-500">Windrichting</span>
          <select
            name="wind"
            defaultValue={sp.wind ?? ""}
            className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm mt-0.5"
          >
            <option value="">Alle</option>
            {["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-wvh hover:bg-wvh-dark text-white text-sm rounded px-3 py-1.5 self-end"
        >
          Filteren
        </button>
      </form>

      {rides.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-zinc-500">
          Geen ritten gevonden.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Datum</th>
                <th className="text-left px-3 py-2">Titel</th>
                <th className="text-left px-3 py-2">Soort</th>
                <th className="text-left px-3 py-2">Niveau</th>
                <th className="text-right px-3 py-2">Km</th>
                <th className="text-left px-3 py-2">Wind</th>
                <th className="text-right px-3 py-2">Deeln.</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className="border-t hover:bg-zinc-50">
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-600 capitalize">
                    {formatDateNL(r.datetime)}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/rides/${r.id}`} className="hover:text-wvh">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2"><CategoryBadge category={r.category} /></td>
                  <td className="px-3 py-2"><LevelBadge level={r.level} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.distanceKm}</td>
                  <td className="px-3 py-2 text-zinc-600">
                    {r.windDirection
                      ? `${r.windDirection} ${Math.round(r.windSpeedKmh ?? 0)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {r._count.participations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
