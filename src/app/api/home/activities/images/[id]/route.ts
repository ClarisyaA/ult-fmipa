import { readFile, stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getHomeActivityById } from "@/lib/home-activities";
import { resolveStoredFilePath } from "@/lib/storage-paths";

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

    if (!session || !["admin", "staff"].includes(session.user.role)) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }
  }

  const absolutePath = resolveStoredFilePath(
    "homeActivities",
    activity.imageStoredName
  );

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
