// Legacy GPX file access. New uploads live in the database (GpxFile model);
// these helpers only serve rides created before that change, whose
// gpxFilename points at a local file or an external URL.

import { readFile } from "fs/promises";
import path from "path";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function isRemoteRef(ref: string) {
  return ref.startsWith("http://") || ref.startsWith("https://");
}

export async function readGpxContent(ref: string): Promise<string | null> {
  try {
    if (isRemoteRef(ref)) {
      const res = await fetch(ref, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.text();
    }
    return await readFile(path.join(LOCAL_UPLOAD_DIR, ref), "utf8");
  } catch {
    return null;
  }
}
