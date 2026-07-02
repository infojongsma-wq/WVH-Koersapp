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
    <form onSubmit={submit} className="card p-6 md:p-8 space-y-5">
      <label className="block">
        <span className="block text-[11px] uppercase tracking-wide font-semibold text-ink-muted mb-1.5">
          Naam
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="field"
          placeholder="Voor- en achternaam"
        />
      </label>
      <label className="block">
        <span className="block text-[11px] uppercase tracking-wide font-semibold text-ink-muted mb-1.5">
          Mijn niveau
        </span>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
          className="field"
        >
          <option value="" disabled>Kies niveau…</option>
          {levels.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label} ({l.speedRange})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Opslaan…" : "Opslaan"}
      </button>
      {msg && <p className="text-sm text-center text-ink-muted">{msg}</p>}
    </form>
  );
}
