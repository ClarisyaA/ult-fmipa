import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getObjectStream, isObjectNotFoundError } from "@/lib/minio-storage";
import { isProfileImageType } from "@/lib/profile-cms-api";
import { getProfileImageRecord } from "@/lib/profile-cms";
import {
  getStorageAreaForProfileType,
  resolveObjectKey,
} from "@/lib/storage-paths";

export const runtime = "nodejs";

type ImageRouteProps = {
  params: Promise<{ type: string; id: string }>;
};

export async function GET(_request: Request, { params }: ImageRouteProps) {
  const { type, id } = await params;

  if (!isProfileImageType(type) || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  const image = await getProfileImageRecord(type, id);

  if (!image) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  if (!image.isActive) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const objectKey = resolveObjectKey(
    getStorageAreaForProfileType(type),
    image.storedName
  );

  if (!objectKey) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const nodeStream = await getObjectStream(objectKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": image.mimeType,
      "Cache-Control": image.isActive ? "public, max-age=300" : "private, max-age=60",
      "Content-Security-Policy":
        image.mimeType === "image/svg+xml"
          ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
          : "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    };

    if (typeof image.sizeBytes === "number") {
      headers["Content-Length"] = String(image.sizeBytes);
    }

    return new Response(webStream, { headers });
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal mengambil gambar dari storage." }, { status: 503 });
  }
}
