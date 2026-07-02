// Uniform storage layer for GPX files.
// Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set (i.e. production),
// falls back to the local filesystem for dev without Vercel Blob configured.

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type StoredFile = {
  // For Blob: full https URL. For local: filename in /public/uploads.
  ref: string;
  isRemote: boolean;
  originalName: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveGpxFile(file: File): Promise<StoredFile> {
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}_${randomBytes(4).toString("hex")}_${safeName(file.name)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`gpx/${filename}`, buf, {
      access: "public",
      contentType: "application/gpx+xml",
    });
    return { ref: blob.url, isRemote: true, originalName: file.name };
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buf);
  return { ref: filename, isRemote: false, originalName: file.name };
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
      // Blob URLs are public but unguessable; just redirect the client there.
      return Response.redirect(ref, 302);
    }
    const buf = await readFile(path.join(LOCAL_UPLOAD_DIR, ref));
    return new Response(buf, {
      headers: {
        "Content-Type": "application/gpx+xml",
      },
    });
  } catch {
    return null;
  }
}
