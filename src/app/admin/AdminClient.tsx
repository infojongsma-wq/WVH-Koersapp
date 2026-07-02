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
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold mb-4">Whitelist e-mailadressen</h2>
        <form onSubmit={addEmail} className="flex flex-col md:flex-row gap-2 mb-5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lid@email.nl"
            className="field flex-1"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notitie (optioneel)"
            className="field flex-1"
          />
          <button type="submit" disabled={pending} className="btn-primary">
            Toevoegen
          </button>
        </form>
        <ul className="divide-y divide-cream-200">
          {initialWhitelist.length === 0 && (
            <li className="py-3 text-ink-muted italic text-sm">
              Nog geen adressen op de whitelist.
            </li>
          )}
          {initialWhitelist.map((w) => (
            <li key={w.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-sm">{w.email}</div>
                {w.note && (
                  <div className="text-xs text-ink-muted">{w.note}</div>
                )}
              </div>
              <button
                onClick={() => removeEmail(w.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold mb-4">Ritten beheren</h2>
        <ul className="divide-y divide-cream-200">
          {initialRides.map((r) => (
            <li key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{r.title}</div>
                <div className="text-xs text-ink-muted">
                  door {r.createdBy.name ?? r.createdBy.email}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`chip ${
                    r.status === "PUBLISHED"
                      ? "!bg-green-50 !border-green-200 !text-green-700"
                      : ""
                  }`}
                >
                  {r.status}
                </span>
                <button
                  onClick={() => toggleRide(r.id, r.status)}
                  className="text-xs text-ink hover:underline"
                >
                  {r.status === "PUBLISHED" ? "Verbergen" : "Publiceren"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
