"use client";

import dynamic from "next/dynamic";

const MapPreview = dynamic(() => import("./MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="h-64 md:h-80 rounded-xl border bg-zinc-50 flex items-center justify-center text-zinc-400 text-sm">
      Kaart laden…
    </div>
  ),
});

export default MapPreview;
