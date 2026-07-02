// Storage for GPX files. Uses Vercel Blob only — never writes to the
// serverless filesystem so we can't hit EROFS on production.

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type StoredFile = {
  ref: string;
  isRemote: boolean;
  originalName: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Save a GPX file. Blob only. Local disk writes are allowed ONLY when the
 * caller explicitly opts in via NEXT_PUBLIC_ALLOW_LOCAL_UPLOADS=true (dev
 * environment). Elsewhere the function throws with a clear message.
 */
export async function saveGpxFile(file: File): Promise<StoredFile> {
  const started = Date.now();
  const filename = `${Date.now()}_${randomBytes(4).toString("hex")}_${safeName(file.name)}`;
  console.log(`[storage] saveGpxFile start: ${file.name} (${file.size} bytes)`);

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    console.log(`[storage] Uploading to Vercel Blob…`);
    try {
      const { put } = await import("@vercel/blob");
      const buf = Buffer.from(await file.arrayBuffer());
      const blob = await put(`gpx/${filename}`, buf, {
        access: "public",
        contentType: "application/gpx+xml",
        token: blobToken,
      });
      console.log(`[storage] Blob upload done in ${Date.now() - started}ms`);
      return { ref: blob.url, isRemote: true, originalName: file.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[storage] Blob upload failed: ${msg}`);
      throw new Error(`Vercel Blob upload mislukt: ${msg}`);
    }
  }

  // Explicit dev-only fallback: only writes to disk when opted in.
  if (process.env.NEXT_PUBLIC_ALLOW_LOCAL_UPLOADS === "true") {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buf);
    return { ref: filename, isRemote: false, originalName: file.name };
  }

  throw new Error(
    "GPX-upload is niet geconfigureerd: BLOB_READ_WRITE_TOKEN ontbreekt. Koppel Storage → Blob aan dit project in Vercel en redeploy."
  );
}

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

export async function streamGpxToResponse(ref: string): Promise<Response | null> {
  try {
    if (isRemoteRef(ref)) {
      return Response.redirect(ref, 302);
    }
    const buf = await readFile(path.join(LOCAL_UPLOAD_DIR, ref));
    return new Response(buf, {
      headers: { "Content-Type": "application/gpx+xml" },
    });
  } catch {
    return null;
  }
}
