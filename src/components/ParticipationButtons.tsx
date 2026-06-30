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

  const baseBtn =
    "flex-1 py-3 px-3 rounded-lg font-medium text-sm md:text-base border transition disabled:opacity-50";

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold mb-3">Doe je mee?</h3>
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => set(current === "GOING" ? null : "GOING")}
          className={`${baseBtn} ${
            current === "GOING"
              ? "bg-green-600 border-green-700 text-white"
              : "bg-white border-zinc-300 text-zinc-700 hover:bg-green-50"
          }`}
        >
          {current === "GOING" ? "✓ " : ""}
          Doe mee
          {isFull && current !== "GOING" && (
            <span className="block text-[10px] opacity-75">(wachtlijst)</span>
          )}
        </button>
        <button
          disabled={pending}
          onClick={() => set(current === "INTERESTED" ? null : "INTERESTED")}
          className={`${baseBtn} ${
            current === "INTERESTED"
              ? "bg-amber-500 border-amber-600 text-white"
              : "bg-white border-zinc-300 text-zinc-700 hover:bg-amber-50"
          }`}
        >
          {current === "INTERESTED" ? "✓ " : ""}🤔 Geïnteresseerd
        </button>
        <button
          disabled={pending}
          onClick={() => set(current === "NOT_GOING" ? null : "NOT_GOING")}
          className={`${baseBtn} ${
            current === "NOT_GOING"
              ? "bg-zinc-700 border-zinc-800 text-white"
              : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {current === "NOT_GOING" ? "✓ " : ""}Niet mee
        </button>
      </div>
      {current && (
        <button
          disabled={pending}
          onClick={() => set(null)}
          className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 underline"
        >
          Selectie wissen
        </button>
      )}
    </div>
  );
}
