import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getHomeActivityById } from "@/lib/home-activities";
import { getObjectStream, isObjectNotFoundError } from "@/lib/minio-storage";
import { resolveObjectKey } from "@/lib/storage-paths";

export const runtime = "nodejs";

type ImageRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ImageRouteProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  const activity = await getHomeActivityById(id);

  if (!activity?.imageStoredName || !activity.imageMimeType) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  if (!activity.isActive) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const objectKey = resolveObjectKey("homeActivities", activity.imageStoredName);

  if (!objectKey) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const nodeStream = await getObjectStream(objectKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": activity.imageMimeType,
      "Cache-Control": activity.isActive ? "public, max-age=300" : "private, max-age=60",
      "Content-Security-Policy":
        activity.imageMimeType === "image/svg+xml"
          ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
          : "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    };

    if (typeof activity.imageSizeBytes === "number") {
      headers["Content-Length"] = String(activity.imageSizeBytes);
    }

    return new Response(webStream, { headers });
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal mengambil gambar dari storage." }, { status: 503 });
  }
}
