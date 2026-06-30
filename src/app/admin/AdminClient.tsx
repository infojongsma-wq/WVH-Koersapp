"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type WhitelistEntry = {
  id: string;
  email: string;
  note: string | null;
  addedAt: string | Date;
};

type RideRow = {
  id: string;
  title: string;
  status: string;
  datetime: string | Date;
  createdBy: { name: string | null; email: string };
};

export default function AdminClient({
  initialWhitelist,
  initialRides,
}: {
  initialWhitelist: WhitelistEntry[];
  initialRides: RideRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    setEmail("");
    setNote("");
    setPending(false);
    startTransition(() => router.refresh());
  }

  async function removeEmail(id: string) {
    if (!confirm("E-mail verwijderen van whitelist?")) return;
    await fetch(`/api/admin/whitelist?id=${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  async function toggleRide(id: string, current: string) {
    const next = current === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    await fetch(`/api/admin/rides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-3">Whitelist e-mailadressen</h2>
        <form onSubmit={addEmail} className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lid@email.nl"
            className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notitie (optioneel)"
            className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-wvh hover:bg-wvh-dark text-white text-sm px-4 py-1.5 rounded disabled:opacity-50"
          >
            Toevoegen
          </button>
        </form>
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 uppercase">
            <tr>
              <th className="text-left py-1">E-mail</th>
              <th className="text-left py-1">Notitie</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initialWhitelist.length === 0 && (
              <tr>
                <td colSpan={3} className="text-zinc-400 italic py-2">
                  Nog geen adressen op de whitelist.
                </td>
              </tr>
            )}
            {initialWhitelist.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="py-1.5">{w.email}</td>
                <td className="py-1.5 text-zinc-500">{w.note ?? ""}</td>
                <td className="py-1.5 text-right">
                  <button
                    onClick={() => removeEmail(w.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-3">Ritten beheren</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 uppercase">
            <tr>
              <th className="text-left py-1">Titel</th>
              <th className="text-left py-1">Aanmaker</th>
              <th className="text-left py-1">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initialRides.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1.5">{r.title}</td>
                <td className="py-1.5 text-zinc-500">
                  {r.createdBy.name ?? r.createdBy.email}
                </td>
                <td className="py-1.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      r.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-1.5 text-right">
                  <button
                    onClick={() => toggleRide(r.id, r.status)}
                    className="text-xs text-wvh hover:underline"
                  >
                    {r.status === "PUBLISHED" ? "Verbergen" : "Publiceren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
