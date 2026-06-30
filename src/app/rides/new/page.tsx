import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, DEFAULT_START_LOCATION, LEVELS } from "@/lib/constants";
import RideForm from "./RideForm";

export default async function NewRidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-1">Nieuwe rit toevoegen</h1>
      <p className="text-zinc-500 mb-6 text-sm">
        Vul de gegevens van de rit in. Weer en wind worden automatisch opgehaald
        op basis van startlocatie en tijd.
      </p>
      <RideForm
        categories={CATEGORIES}
        levels={LEVELS}
        defaultStartLocation={DEFAULT_START_LOCATION}
        defaultCaptainName={user.name ?? ""}
        createdByLabel={user.name ?? user.email}
      />
    </main>
  );
}
