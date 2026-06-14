import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getInformationApiErrorStatus } from "@/lib/information-api";
import { getInformationPostById } from "@/lib/information-posts";
import {
  getInformationPostImageRecord,
  setInformationPostCoverImage,
} from "@/lib/information-post-images";

type CoverRouteProps = {
  params: Promise<{ id: string; imageId: string }>;
};

export async function POST(_request: Request, { params }: CoverRouteProps) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, imageId } = await params;
    const post = await getInformationPostById(id);
    const image = await getInformationPostImageRecord(imageId);

    if (!post || !image || String(image.POST_ID) !== id) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan." },
        { status: 404 }
      );
    }

    await setInformationPostCoverImage(id, imageId);

    return NextResponse.json({ message: "Cover berhasil diperbarui." });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Cover gagal diperbarui." },
      { status: 500 }
    );
  }
}
