import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";

// Issues short-lived client tokens so the browser can PUT the GPX file
// directly to Vercel Blob without proxying through this serverless function.
// Bypasses the 4.5MB body limit and any function-timeout related hangs.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob niet gekoppeld: BLOB_READ_WRITE_TOKEN ontbreekt. Koppel Storage → Blob aan dit project in Vercel.",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/gpx+xml",
          "text/xml",
          "application/xml",
          "application/octet-stream",
          "text/plain",
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
        tokenPayload: JSON.stringify({ userId: user.id }),
      }),
      onUploadCompleted: async () => {
        // Blob is stored; ride creation happens separately.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload token faalde";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
