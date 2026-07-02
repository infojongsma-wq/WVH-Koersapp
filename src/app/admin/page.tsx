import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN")
    return (
      <div className="max-w-xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-display text-2xl font-bold mb-2">Geen toegang</h1>
        <p className="text-ink-muted">
          Alleen admins kunnen deze pagina bekijken.
        </p>
      </div>
    );

  const [whitelist, rides] = await Promise.all([
    prisma.whitelistEntry.findMany({ orderBy: { addedAt: "desc" } }),
    prisma.ride.findMany({
      orderBy: { datetime: "desc" },
      take: 50,
      include: { createdBy: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
        Admin
      </h1>
      <AdminClient initialWhitelist={whitelist} initialRides={rides as never} />
    </div>
  );
}
