"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  categories: { value: string; label: string; emoji: string }[];
  levels: { value: string; label: string; speedRange: string }[];
  defaultStartLocation: string;
  defaultCaptainName: string;
  createdByLabel: string;
};

export default function RideForm(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/rides", { method: "POST", body: form });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis");
      return;
    }
    router.push(`/rides/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Datum + tijd" required>
          <input
            type="datetime-local"
            name="datetime"
            required
            className="form-input"
            min={new Date().toISOString().slice(0, 16)}
          />
        </Field>
        <Field label="Titel" required>
          <input
            type="text"
            name="title"
            required
            placeholder="Bijv. Sallandse heuvelrug + koffie"
            className="form-input"
          />
        </Field>

        <Field label="Soort rit" required>
          <select name="category" required className="form-input" defaultValue="">
            <option value="" disabled>Kies soort…</option>
            {props.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Niveau" required>
          <select name="level" required className="form-input" defaultValue="">
            <option value="" disabled>Kies niveau…</option>
            {props.levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label} ({l.speedRange})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Kilometers" required>
          <input
            type="number"
            name="distanceKm"
            min="1"
            step="0.1"
            required
            placeholder="bijv. 85"
            className="form-input"
          />
        </Field>

        <Field label="Gem. snelheid (km/u)" required>
          <input
            type="number"
            name="avgSpeedKmh"
            min="15"
            max="50"
            step="0.5"
            required
            placeholder="bijv. 31"
            className="form-input"
          />
        </Field>

        <Field label="Wegkapitein">
          <input
            type="text"
            name="captainName"
            defaultValue={props.defaultCaptainName}
            placeholder="Naam wegkapitein"
            className="form-input"
          />
        </Field>

        <Field label="Koffiestop?">
          <label className="flex items-center gap-2 h-[42px]">
            <input type="checkbox" name="coffeeStop" className="h-5 w-5" />
            <span className="text-sm text-zinc-600">Ja, we plannen een koffiestop</span>
          </label>
        </Field>

        <Field label="Startlocatie" className="md:col-span-2">
          <input
            type="text"
            name="startLocation"
            defaultValue={props.defaultStartLocation}
            className="form-input"
          />
        </Field>

        <Field label="Omschrijving" className="md:col-span-2">
          <textarea
            name="description"
            rows={3}
            placeholder="Wat is het plan? Welke route?"
            className="form-input"
          />
        </Field>

        <Field
          label="Opmerking (weer/wind/overig)"
          className="md:col-span-2"
          hint="Tip: weer + wind worden automatisch opgehaald. Hier alleen extra info."
        >
          <textarea
            name="notes"
            rows={2}
            placeholder="bijv. ‘Pas op met losliggend grind tussen Markelo en Goor’"
            className="form-input"
          />
        </Field>

        <Field label="GPX-bestand (optioneel)" className="md:col-span-2">
          <input
            type="file"
            name="gpx"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            className="form-input"
          />
        </Field>
      </div>

      <div className="text-xs text-zinc-500 pt-2 border-t">
        Rit wordt aangemaakt door: <strong>{props.createdByLabel}</strong>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-wvh hover:bg-wvh-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
      >
        {submitting ? "Bezig met aanmaken…" : "Rit aanmaken"}
      </button>

      <style>{`
        .form-input {
          display: block;
          width: 100%;
          border: 1px solid #d4d4d8;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.95rem;
        }
        .form-input:focus {
          outline: none;
          border-color: #0b3d91;
          box-shadow: 0 0 0 2px rgba(11,61,145,0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium text-zinc-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-zinc-500 mt-1">{hint}</span>}
    </label>
  );
}
