"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initialName,
  initialLevel,
  levels,
}: {
  initialName: string;
  initialLevel: string;
  levels: { value: string; label: string; speedRange: string }[];
}) {
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState(initialLevel);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, level }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Profiel opgeslagen");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Opslaan mislukt");
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Naam</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2"
          placeholder="Voor- en achternaam"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Mijn niveau</span>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
          className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2"
        >
          <option value="" disabled>Kies niveau…</option>
          {levels.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label} ({l.speedRange})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-wvh hover:bg-wvh-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
      >
        {saving ? "Opslaan…" : "Opslaan"}
      </button>
      {msg && <p className="text-sm text-center text-zinc-600">{msg}</p>}
    </form>
  );
}
