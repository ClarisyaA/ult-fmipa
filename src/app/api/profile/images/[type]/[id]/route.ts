import { readFile, stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { isProfileImageType } from "@/lib/profile-cms-api";
import { getProfileImageRecord } from "@/lib/profile-cms";
import {
  getStorageAreaForProfileType,
  resolveStoredFilePath,
} from "@/lib/storage-paths";

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

  const absolutePath = resolveStoredFilePath(
    getStorageAreaForProfileType(type),
    image.storedName
  );

  if (!absolutePath) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const file = await readFile(absolutePath);

    return new Response(file, {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": image.isActive ? "public, max-age=300" : "private, max-age=60",
        "Content-Security-Policy":
          image.mimeType === "image/svg+xml"
            ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
            : "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }
}
