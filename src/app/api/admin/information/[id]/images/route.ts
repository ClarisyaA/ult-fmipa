import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getInformationApiErrorStatus,
  saveInformationImagesForPost,
} from "@/lib/information-api";
import { normalizeInformationImageFit } from "@/lib/information-post-images";
import { getInformationPostById } from "@/lib/information-posts";

type ImagesRouteProps = {
  params: Promise<{ id: string }>;
};

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getImageFits(formData: FormData) {
  return formData.getAll("imageFits").map((value) =>
    normalizeInformationImageFit(typeof value === "string" ? value : null)
  );
}

export async function POST(request: Request, { params }: ImagesRouteProps) {
  const user = await requireRole(["ADMIN"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const post = await getInformationPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Informasi tidak ditemukan." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    await saveInformationImagesForPost(id, getImageFiles(formData), getImageFits(formData));

    return NextResponse.json({ message: "Gambar berhasil ditambahkan." });
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
      "api:admin:information:images:post",
      "Gambar gagal ditambahkan."
    );
  }
}
