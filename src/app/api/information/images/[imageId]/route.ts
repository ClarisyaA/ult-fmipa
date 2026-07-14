import { readFile, stat } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  getInformationPostById,
  isInformationPostCurrentlyVisible,
} from "@/lib/information-posts";
import { getInformationPostImageRecord } from "@/lib/information-post-images";

type ImageRouteProps = {
  params: Promise<{ imageId: string }>;
};

function resolveStoragePath(storedName: string) {
  if (path.basename(storedName) !== storedName) {
    return null;
  }

  const storageRoot = path.resolve(process.cwd(), "storage", "information");
  const absolutePath = path.join(storageRoot, storedName);

  if (
    absolutePath === storageRoot ||
    !absolutePath.startsWith(`${storageRoot}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
}

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

    if (!session || !["admin", "staff"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const absolutePath = resolveStoragePath(image.STORED_NAME);

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
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }
}
