"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const sp = useSearchParams();
  const error = sp.get("error");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setLoginUrl(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus({
        ok: res.ok,
        msg: data.message ?? data.error ?? "Onbekende fout",
      });
      if (data.loginUrl) setLoginUrl(data.loginUrl);
    } catch {
      setStatus({ ok: false, msg: "Verbindingsfout — probeer opnieuw" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="card p-8 md:p-10 max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="text-3xl">🚴</div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              WVH Koersapp
            </h1>
            <p className="text-sm text-ink-muted">Wielerclub Holten</p>
          </div>
        </div>
        <p className="text-ink mb-6 leading-relaxed">
          Vul je e-mailadres in om in te loggen — geen wachtwoord nodig.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
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
            className="field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig…" : "Inloggen"}
          </button>
        </form>
        {status && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm ${
              status.ok
                ? "bg-wvh-yellow/20 border border-wvh-yellow text-ink"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {status.msg}
          </div>
        )}
        {loginUrl && (
          <a
            href={loginUrl}
            className="btn-primary w-full mt-3 !py-4 text-base animate-pulse"
          >
            → Klik hier om in te loggen
          </a>
        )}
        <p className="text-xs text-ink-muted mt-8 text-center">
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
