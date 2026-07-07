import { prisma } from "@/lib/prisma";
import { isMailConfigured, verifyMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Human-readable health page — open /status to see, in plain Dutch, whether
// the database and the e-mailverzending werken. Bedoeld om te screenshotten
// bij problemen met de inlogmail.
export default async function StatusPage() {
  let dbOk = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const mailConfigured = isMailConfigured();
  const mail = mailConfigured
    ? await verifyMail()
    : { ok: false, error: "Geen SMTP-gegevens ingesteld" };

  const settings = {
    "SMTP host": process.env.SMTP_HOST ?? "(niet ingesteld)",
    "SMTP poort": process.env.SMTP_PORT ?? "(niet ingesteld)",
    "SMTP gebruiker (login)": process.env.SMTP_USER ?? "(niet ingesteld)",
    "Afzender (MAIL_FROM_ADDRESS)":
      process.env.MAIL_FROM_ADDRESS ?? process.env.SMTP_USER ?? "(niet ingesteld)",
    Versie: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-6">
        Status
      </h1>

      <Row label="Database" ok={dbOk} detail={dbError} />
      <Row
        label="E-mailverzending (SMTP)"
        ok={mail.ok}
        detail={mail.ok ? "Verbinding + inloggegevens kloppen" : mail.error ?? null}
      />

      <div className="card p-5 mt-6">
        <h2 className="font-display text-lg font-bold mb-3">Instellingen in gebruik</h2>
        <dl className="text-sm space-y-2">
          {Object.entries(settings).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="font-medium text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {!mail.ok && mailConfigured && (
        <div className="card p-5 mt-4 border-l-4 border-l-red-400">
          <h2 className="font-semibold mb-2">Wat betekent de e-mailfout?</h2>
          <ul className="text-sm text-ink space-y-2 list-disc pl-5">
            <li>
              <strong>&ldquo;Invalid login&rdquo; / &ldquo;authentication failed&rdquo; / &ldquo;535&rdquo;</strong> →
              de SMTP-gebruiker of het wachtwoord klopt niet. Bij Brevo moet dit
              de <em>SMTP-login</em> en een <em>SMTP-key</em> zijn (niet een API-key
              die met <code>xkeysib-</code> begint).
            </li>
            <li>
              <strong>&ldquo;sender not authorized&rdquo; / &ldquo;not valid&rdquo;</strong> →
              het afzenderadres is nog niet geverifieerd bij de mailprovider.
            </li>
            <li>
              <strong>&ldquo;not activated&rdquo; / &ldquo;not allowed&rdquo;</strong> →
              het mailaccount moet nog geactiveerd/vrijgegeven worden.
            </li>
          </ul>
        </div>
      )}

      <p className="text-xs text-ink-muted mt-6">
        Maak een screenshot van deze pagina en stuur die door als de inlogmail
        niet werkt.
      </p>
    </div>
  );
}

function Row({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string | null;
}) {
  return (
    <div className="card p-4 mb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold ${
            ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {ok ? "✓ Werkt" : "✕ Fout"}
        </span>
      </div>
      {detail && (
        <p
          className={`text-sm mt-2 break-words ${
            ok ? "text-ink-muted" : "text-red-700"
          }`}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
