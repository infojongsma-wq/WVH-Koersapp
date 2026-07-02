"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

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
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setProgress(null);

    const form = new FormData(e.currentTarget);
    const gpxFile = form.get("gpx");
    const hasGpx = gpxFile instanceof File && gpxFile.size > 0;

    try {
      // 1. Upload the GPX directly to Vercel Blob (browser → blob storage),
      // bypassing our serverless function. Server then only stores the URL.
      if (hasGpx) {
        setProgress("GPX-bestand uploaden…");
        // Verify the token endpoint responds first — its actual error message
        // is more useful than the generic Blob client "failed to retrieve token".
        const probe = await fetch("/api/upload/gpx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "blob.generate-client-token", payload: null }),
        });
        if (!probe.ok) {
          const txt = await probe.text().catch(() => "");
          let msg = txt;
          try {
            const j = JSON.parse(txt);
            msg = j.error ?? txt;
          } catch {}
          throw new Error(
            `Blob-tokenendpoint gaf ${probe.status}: ${msg || "onbekende fout"}`
          );
        }

        const uploadTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Blob upload duurde langer dan 30s")), 30_000)
        );
        const blob = await Promise.race([
          upload(`gpx/${gpxFile.name}`, gpxFile, {
            access: "public",
            handleUploadUrl: "/api/upload/gpx",
          }),
          uploadTimeout,
        ]);
        form.set("gpxUrl", blob.url);
        form.set("gpxOriginalName", gpxFile.name);
        form.delete("gpx");
      }

      // 2. Submit ride metadata to /api/rides.
      setProgress("Rit aanmaken…");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch("/api/rides", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const raw = await res.text();
      let data: { id?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw.slice(0, 200) || `HTTP ${res.status}` };
      }
      if (!res.ok || !data.id) {
        setSubmitting(false);
        setProgress(null);
        setError(data.error ?? `Er ging iets mis (${res.status})`);
        return;
      }
      router.push(`/rides/${data.id}`);
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      setProgress(null);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Time-out — probeer opnieuw of neem contact op.");
      } else {
        setError(
          err instanceof Error
            ? `Fout: ${err.message}`
            : "Onbekende fout bij aanmaken"
        );
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 md:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Datum + tijd" required>
          <input
            type="datetime-local"
            name="datetime"
            required
            className="field"
            min={new Date().toISOString().slice(0, 16)}
          />
        </Field>
        <Field label="Titel" required>
          <input
            type="text"
            name="title"
            required
            placeholder="bv. Sallandse heuvelrug + koffie"
            className="field"
          />
        </Field>

        <Field label="Soort rit" required>
          <select name="category" required className="field" defaultValue="">
            <option value="" disabled>Kies soort…</option>
            {props.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Niveau" required>
          <select name="level" required className="field" defaultValue="">
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
            placeholder="bv. 85"
            className="field"
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
            placeholder="bv. 31"
            className="field"
          />
        </Field>

        <Field label="Wegkapitein">
          <input
            type="text"
            name="captainName"
            defaultValue={props.defaultCaptainName}
            placeholder="Naam wegkapitein"
            className="field"
          />
        </Field>

        <Field label="Koffiestop?">
          <label className="flex items-center gap-3 h-[46px] px-4 rounded-xl bg-white border border-cream-200 cursor-pointer hover:bg-cream-50 transition">
            <input type="checkbox" name="coffeeStop" className="h-5 w-5 accent-wvh-yellow" />
            <span className="text-sm text-ink">Ja, we plannen een koffiestop</span>
          </label>
        </Field>

        <Field label="Startlocatie" className="md:col-span-2">
          <input
            type="text"
            name="startLocation"
            defaultValue={props.defaultStartLocation}
            className="field"
          />
        </Field>

        <Field label="Omschrijving" className="md:col-span-2">
          <textarea
            name="description"
            rows={3}
            placeholder="Wat is het plan? Welke route?"
            className="field"
          />
        </Field>

        <Field
          label="Opmerking (weer/wind/overig)"
          className="md:col-span-2"
          hint="Weer + wind worden automatisch opgehaald. Hier alleen extra info."
        >
          <textarea
            name="notes"
            rows={2}
            placeholder="bv. ‘Pas op met losliggend grind tussen Markelo en Goor’"
            className="field"
          />
        </Field>

        <Field label="GPX-bestand (optioneel)" className="md:col-span-2">
          <input
            type="file"
            name="gpx"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            className="field file:mr-4 file:py-1 file:px-3 file:rounded-pill file:border-0 file:bg-ink file:text-white file:text-xs file:font-medium hover:file:bg-ink-soft"
          />
        </Field>
      </div>

      <div className="text-xs text-ink-muted pt-4 border-t border-cream-200">
        Rit wordt aangemaakt door: <strong className="text-ink">{props.createdByLabel}</strong>
      </div>

      {progress && !error && (
        <div className="bg-cream-100 border border-cream-200 text-ink p-3 rounded-xl text-sm">
          {progress}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? (progress ?? "Bezig…") : "Rit aanmaken"}
      </button>
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
      <span className="block text-[11px] uppercase tracking-wide font-semibold text-ink-muted mb-1.5">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-ink-muted mt-1.5">{hint}</span>}
    </label>
  );
}
