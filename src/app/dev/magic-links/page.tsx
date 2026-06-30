import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MagicLinksDevPage() {
  const tokens = await prisma.magicLinkToken.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Dev: actieve magic links</h1>
      <p className="text-zinc-600 mb-6 text-sm">
        Alleen voor de proof-of-concept. In productie wordt deze pagina verwijderd
        en gaan inloglinks per e-mail.
      </p>
      <div className="space-y-2">
        {tokens.length === 0 && (
          <p className="text-zinc-500">Nog geen tokens. Vraag eerst een inloglink aan op /login.</p>
        )}
        {tokens.map((t) => {
          const expired = t.expiresAt < new Date();
          const used = Boolean(t.usedAt);
          const url = `${base}/api/auth/verify?token=${t.token}`;
          return (
            <div
              key={t.id}
              className={`border rounded p-3 text-sm ${
                used || expired ? "bg-zinc-50 text-zinc-400" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium">{t.email}</span>
                <span className="text-xs">
                  {used ? "✓ gebruikt" : expired ? "× verlopen" : "geldig"}
                </span>
              </div>
              {!used && !expired ? (
                <a className="text-wvh underline break-all" href={url}>
                  {url}
                </a>
              ) : (
                <span className="text-xs break-all">{url}</span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
