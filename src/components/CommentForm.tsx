"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CommentForm({ rideId }: { rideId: string }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/rides/${rideId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis");
      return;
    }
    setBody("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Voeg een opmerking toe…"
        rows={2}
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wvh"
      />
      {error && <div className="text-red-600 text-xs">{error}</div>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="bg-wvh hover:bg-wvh-dark text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Plaats"}
        </button>
      </div>
    </form>
  );
}
