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
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-bold mb-2">Geen toegang</h1>
        <p className="text-zinc-600">Alleen admins kunnen deze pagina bekijken.</p>
      </main>
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
    <main className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <AdminClient initialWhitelist={whitelist} initialRides={rides as never} />
    </main>
  );
}
