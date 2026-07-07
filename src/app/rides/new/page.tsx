import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, DEFAULT_START_LOCATION, LEVELS } from "@/lib/constants";
import RideForm from "./RideForm";

export default async function NewRidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <Link
        href="/"
        className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1 mb-4"
      >
        <span aria-hidden>←</span> Terug naar overzicht
      </Link>
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
        Nieuwe rit
      </h1>
      <p className="text-ink-muted mb-6 text-sm">
        Vul de gegevens in. Weer en wind worden automatisch opgehaald op basis
        van startlocatie en tijdstip.
      </p>
      <RideForm
        categories={CATEGORIES}
        levels={LEVELS}
        defaultStartLocation={DEFAULT_START_LOCATION}
        defaultCaptainName={user.name ?? ""}
        createdByLabel={user.name ?? user.email}
      />
    </div>
  );
}
