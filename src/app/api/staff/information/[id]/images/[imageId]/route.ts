import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getInformationApiErrorStatus } from "@/lib/information-api";
import { getInformationPostById } from "@/lib/information-posts";
import {
  deleteInformationPostImage,
  getInformationPostImageRecord,
  replaceInformationPostImage,
  updateInformationPostImageMetadata,
} from "@/lib/information-post-images";

type ImageRouteProps = {
  params: Promise<{ id: string; imageId: string }>;
};

const supportedPatchFields = new Set(["altText", "imageFit"]);

async function assertImageBelongsToPost(id: string, imageId: string) {
  const post = await getInformationPostById(id);
  const image = await getInformationPostImageRecord(imageId);

  return Boolean(post && image && String(image.POST_ID) === id);
}

export async function PATCH(request: Request, { params }: ImageRouteProps) {
  const user = await requireRole(["STAFF"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, imageId } = await params;

    if (!(await assertImageBelongsToPost(id, imageId))) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan." },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageFile = formData.get("image");

      if (!(imageFile instanceof File)) {
        return NextResponse.json(
          { error: "Gambar pengganti tidak ditemukan." },
          { status: 400 }
        );
      }

      const image = await replaceInformationPostImage(id, imageId, imageFile, {
        altText:
          typeof formData.get("altText") === "string"
            ? String(formData.get("altText"))
            : null,
        imageFit:
          typeof formData.get("imageFit") === "string"
            ? String(formData.get("imageFit"))
            : null,
      });

      return NextResponse.json({
        data: { image },
        image,
        message: "Gambar berhasil diganti.",
      });
    }

    const body = (await request.json().catch(() => ({}))) as {
      altText?: string | null;
      imageFit?: string | null;
    };

    for (const key of Object.keys(body)) {
      if (!supportedPatchFields.has(key)) {
        return NextResponse.json(
          { error: `Field ${key} tidak didukung.` },
          { status: 400 }
        );
      }
    }

    await updateInformationPostImageMetadata(imageId, {
      altText: body.altText ?? null,
      imageFit: body.imageFit,
    });

    return NextResponse.json({ message: "Gambar berhasil diperbarui." });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:staff:information:image:patch",
      "Gambar gagal diperbarui."
    );
  }
}

export async function DELETE(_request: Request, { params }: ImageRouteProps) {
  const user = await requireRole(["STAFF"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, imageId } = await params;

    if (!(await assertImageBelongsToPost(id, imageId))) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan." },
        { status: 404 }
      );
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

    return jsonApiError(
      error,
      "api:staff:information:image:delete",
      "Gambar gagal dihapus."
    );
  }
}
