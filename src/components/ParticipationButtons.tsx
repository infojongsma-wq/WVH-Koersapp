"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "GOING" | "INTERESTED" | "NOT_GOING" | null;

export default function ParticipationButtons({
  rideId,
  initial,
  isFull,
}: {
  rideId: string;
  initial: Status;
  isFull: boolean;
}) {
  const [current, setCurrent] = useState<Status>(initial);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function set(newStatus: Status) {
    setPending(true);
    if (newStatus === null) {
      await fetch(`/api/rides/${rideId}/participate`, { method: "DELETE" });
    } else {
      await fetch(`/api/rides/${rideId}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    }
    setCurrent(newStatus);
    setPending(false);
    startTransition(() => router.refresh());
  }

  const btn =
    "flex-1 rounded-pill py-3.5 px-4 font-semibold text-sm md:text-base border-2 transition disabled:opacity-50";

  return (
    <div className="card p-5 md:p-6">
      <h3 className="font-display text-xl font-bold mb-4">Doe je mee?</h3>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          disabled={pending}
          onClick={() => set(current === "GOING" ? null : "GOING")}
          className={`${btn} ${
            current === "GOING"
              ? "bg-ink border-ink text-white"
              : "bg-white border-cream-200 text-ink hover:border-ink"
          }`}
        >
          {current === "GOING" && "✓ "}
          Doe mee
          {isFull && current !== "GOING" && (
            <span className="block text-[11px] font-normal opacity-75">
              (wachtlijst)
            </span>
          )}
        </button>
        <button
          disabled={pending}
          onClick={() => set(current === "INTERESTED" ? null : "INTERESTED")}
          className={`${btn} ${
            current === "INTERESTED"
              ? "bg-wvh-yellow border-wvh-yellow text-ink"
              : "bg-white border-cream-200 text-ink hover:border-wvh-yellow"
          }`}
        >
          {current === "INTERESTED" && "✓ "}
          🤔 Geïnteresseerd
        </button>
        <button
          disabled={pending}
          onClick={() => set(current === "NOT_GOING" ? null : "NOT_GOING")}
          className={`${btn} ${
            current === "NOT_GOING"
              ? "bg-cream-200 border-cream-300 text-ink"
              : "bg-white border-cream-200 text-ink hover:bg-cream-50"
          }`}
        >
          {current === "NOT_GOING" && "✓ "}
          Niet mee
        </button>
      </div>
      {current && (
        <button
          disabled={pending}
          onClick={() => set(null)}
          className="mt-3 text-xs text-ink-muted hover:text-ink underline"
        >
          Selectie wissen
        </button>
      )}
    </div>
  );
}
