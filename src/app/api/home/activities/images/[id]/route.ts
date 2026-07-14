import { readFile, stat } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getHomeActivityById } from "@/lib/home-activities";

type ImageRouteProps = {
  params: Promise<{ id: string }>;
};

function resolveStoragePath(storedName: string | null) {
  if (!storedName || path.basename(storedName) !== storedName) {
    return null;
  }

  const storageRoot = path.resolve(process.cwd(), "storage", "home-activities");
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
  const { id } = await params;
  const activity = await getHomeActivityById(id);

  if (!activity?.imageStoredName || !activity.imageMimeType) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  if (!activity.isActive) {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "staff"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const absolutePath = resolveStoragePath(activity.imageStoredName);

  if (!absolutePath) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const file = await readFile(absolutePath);

    return new Response(file, {
      headers: {
        "Content-Type": activity.imageMimeType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": activity.isActive ? "public, max-age=300" : "private, max-age=60",
        "Content-Security-Policy":
          activity.imageMimeType === "image/svg+xml"
            ? "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;"
            : "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }
}
