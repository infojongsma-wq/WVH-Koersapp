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
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
        Rittenbibliotheek
      </h1>
      <p className="text-ink-muted mb-6 text-sm">
        Alle ritten (toekomst + verleden). Gebruik de filters om te zoeken.
      </p>

      <form
        method="get"
        className="card p-4 md:p-5 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
      >
        <label className="md:col-span-2 block">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
            Zoek
          </span>
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            className="field mt-1"
            placeholder="titel, kapitein, omschrijving"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
            Min km
          </span>
          <input
            type="number"
            name="minKm"
            defaultValue={sp.minKm ?? ""}
            className="field mt-1"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
            Max km
          </span>
          <input
            type="number"
            name="maxKm"
            defaultValue={sp.maxKm ?? ""}
            className="field mt-1"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
            Wind
          </span>
          <select
            name="wind"
            defaultValue={sp.wind ?? ""}
            className="field mt-1"
          >
            <option value="">Alle</option>
            {["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Filteren
        </button>
      </form>

      {rides.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted">
          Geen ritten gevonden.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-cream-200">
            {rides.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/rides/${r.id}`}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-3 md:gap-6 items-center px-5 py-4 hover:bg-cream-50 transition"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <LevelBadge level={r.level} />
                      <CategoryBadge category={r.category} />
                    </div>
                    <h3 className="font-semibold text-ink truncate">{r.title}</h3>
                    {r.captainName && (
                      <p className="text-xs text-ink-muted mt-0.5">🎩 {r.captainName}</p>
                    )}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div className="text-[11px] uppercase text-ink-muted font-semibold">Km</div>
                    <div>{r.distanceKm}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-[11px] uppercase text-ink-muted font-semibold">Wind</div>
                    <div>
                      {r.windDirection
                        ? `${r.windDirection} ${Math.round(r.windSpeedKmh ?? 0)}`
                        : "—"}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div className="text-[11px] uppercase text-ink-muted font-semibold">Deeln.</div>
                    <div>{r._count.participations}</div>
                  </div>
                  <div className="text-right text-sm text-ink-muted whitespace-nowrap capitalize">
                    {formatDateNL(r.datetime)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
