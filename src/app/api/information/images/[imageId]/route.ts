import { readFile, stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  getInformationPostById,
  isInformationPostCurrentlyVisible,
} from "@/lib/information-posts";
import { getInformationPostImageRecord } from "@/lib/information-post-images";
import { resolveStoredFilePath } from "@/lib/storage-paths";

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

  const absolutePath = resolveStoredFilePath("information", image.STORED_NAME);

  if (!absolutePath) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const file = await readFile(absolutePath);

    return new Response(file, {
      headers: {
        "Content-Type": image.MIME_TYPE,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=300",
        "Content-Security-Policy":
          image.MIME_TYPE === "image/svg+xml"
            ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
            : "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File gambar tidak tersedia di storage lokal." },
      { status: 404 },
    );
  }
}
