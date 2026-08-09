import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getHomeActivityById } from "@/lib/home-activities";
import { getHomeActivityImageRecordById } from "@/lib/home-activity-images";
import { getObjectStream, isObjectNotFoundError } from "@/lib/minio-storage";
import { resolveObjectKey } from "@/lib/storage-paths";

export const runtime = "nodejs";

type ImageRouteProps = {
  params: Promise<{ imageId: string }>;
};

export async function GET(_request: Request, { params }: ImageRouteProps) {
  const { imageId } = await params;

  if (!/^\d+$/.test(imageId)) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  const image = await getHomeActivityImageRecordById(imageId);

  if (!image?.IMAGE_STORED_NAME || !image.IMAGE_MIME_TYPE) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  const activity = await getHomeActivityById(String(image.ACTIVITY_ID));

  if (!activity) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  if (!activity.isActive) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const objectKey = resolveObjectKey("homeActivities", image.IMAGE_STORED_NAME);

  if (!objectKey) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const nodeStream = await getObjectStream(objectKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": image.IMAGE_MIME_TYPE,
      "Cache-Control": activity.isActive ? "public, max-age=300" : "private, max-age=60",
      "Content-Security-Policy":
        image.IMAGE_MIME_TYPE === "image/svg+xml"
          ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
          : "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    };

    if (typeof image.IMAGE_SIZE_BYTES === "number") {
      headers["Content-Length"] = String(image.IMAGE_SIZE_BYTES);
    }

    return new Response(webStream, { headers });
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal mengambil gambar dari storage." }, { status: 503 });
  }
}
