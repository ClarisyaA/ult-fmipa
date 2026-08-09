import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  getInformationPostById,
  isInformationPostCurrentlyVisible,
} from "@/lib/information-posts";
import { getInformationPostImageRecord } from "@/lib/information-post-images";
import { getObjectStream, isObjectNotFoundError } from "@/lib/minio-storage";
import { resolveObjectKey } from "@/lib/storage-paths";

export const runtime = "nodejs";

type ImageRouteProps = {
  params: Promise<{ imageId: string }>;
};

export async function GET(_request: Request, { params }: ImageRouteProps) {
  const { imageId } = await params;
  const image = await getInformationPostImageRecord(imageId);

  if (!image) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  const post = await getInformationPostById(String(image.POST_ID));

  if (!post) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  if (!isInformationPostCurrentlyVisible(post)) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const objectKey = resolveObjectKey("information", image.STORED_NAME);

  if (!objectKey) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const nodeStream = await getObjectStream(objectKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": image.MIME_TYPE,
        "Content-Length": String(image.SIZE_BYTES),
        "Cache-Control": "private, max-age=300",
        "Content-Security-Policy":
          image.MIME_TYPE === "image/svg+xml"
            ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
            : "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Gagal mengambil gambar dari storage." },
      { status: 503 },
    );
  }
}
