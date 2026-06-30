"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const sp = useSearchParams();
  const error = sp.get("error");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setStatus({
      ok: res.ok,
      msg: data.message ?? data.error ?? "Onbekende fout",
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wvh to-wvh-dark p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🚴</div>
          <div>
            <h1 className="text-2xl font-bold text-wvh">WVH Koersapp</h1>
            <p className="text-sm text-zinc-500">Wielerclub Holten</p>
          </div>
        </div>
        <p className="text-zinc-700 mb-6">
          Vul je e-mailadres in. Je ontvangt een inloglink (geen wachtwoord nodig).
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jij@email.nl"
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wvh"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wvh hover:bg-wvh-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Bezig…" : "Stuur inloglink"}
          </button>
        </form>
        {status && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              status.ok
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {status.msg}
          </div>
        )}
        <p className="text-xs text-zinc-400 mt-6 text-center">
          Geen toegang? Vraag de beheerder om je e-mailadres op de whitelist te zetten.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginInner />
    </Suspense>
  );
}
