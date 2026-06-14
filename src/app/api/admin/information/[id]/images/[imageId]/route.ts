import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getInformationApiErrorStatus } from "@/lib/information-api";
import { getInformationPostById } from "@/lib/information-posts";
import {
  deleteInformationPostImage,
  getInformationPostImageRecord,
  updateInformationPostImageAltText,
} from "@/lib/information-post-images";

type ImageRouteProps = {
  params: Promise<{ id: string; imageId: string }>;
};

async function assertImageBelongsToPost(id: string, imageId: string) {
  const post = await getInformationPostById(id);
  const image = await getInformationPostImageRecord(imageId);

  return Boolean(post && image && String(image.POST_ID) === id);
}

export async function PATCH(request: Request, { params }: ImageRouteProps) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, imageId } = await params;

    if (!(await assertImageBelongsToPost(id, imageId))) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      altText?: string | null;
    };
    await updateInformationPostImageAltText(imageId, body.altText ?? null);

    return NextResponse.json({ message: "Alt text berhasil diperbarui." });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Gambar gagal diperbarui." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: ImageRouteProps) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, imageId } = await params;

    if (!(await assertImageBelongsToPost(id, imageId))) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    await deleteInformationPostImage(imageId);

    return NextResponse.json({ message: "Gambar berhasil dihapus." });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Gambar gagal dihapus." },
      { status: 500 }
    );
  }
}

