import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  addHomeActivityImages,
  deleteHomeActivityImage,
  getHomeActivityImageApiErrorStatus,
  getHomeActivityImageRecordById,
  getHomeActivityImages,
  MAX_HOME_ACTIVITY_IMAGES,
  replaceHomeActivityImage,
  setHomeActivityImageCover,
  updateHomeActivityImageMetadata,
} from "@/lib/home-activity-images";
import { getHomeActivityById } from "@/lib/home-activities";

type RolePrefix = "admin" | "staff";

async function requireRole(rolePrefix: RolePrefix) {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const allowed = rolePrefix === "admin" ? user.role === "ADMIN" : ["ADMIN", "STAFF"].includes(user.role);

  if (!allowed) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

function handledApiError(error: unknown) {
  const apiError = getHomeActivityImageApiErrorStatus(error);

  if (!apiError) {
    return null;
  }

  return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
}

async function assertImageBelongsToActivity(activityId: string, imageId: string) {
  const activity = await getHomeActivityById(activityId);
  const image = await getHomeActivityImageRecordById(imageId);

  return Boolean(activity && image && String(image.ACTIVITY_ID) === activityId);
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => (typeof value === "string" ? value : ""));
}

export async function handleHomeActivityImagesGet(rolePrefix: RolePrefix, activityId: string) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const activity = await getHomeActivityById(activityId);

    if (!activity) {
      return NextResponse.json({ error: "Kegiatan mahasiswa tidak ditemukan." }, { status: 404 });
    }

    const images = await getHomeActivityImages(activityId);
    return NextResponse.json({ data: images });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:home-activities:images:get`,
        "Gambar kegiatan gagal dimuat."
      )
    );
  }
}

export async function handleHomeActivityImagesCreate(
  request: Request,
  rolePrefix: RolePrefix,
  activityId: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const activity = await getHomeActivityById(activityId);

    if (!activity) {
      return NextResponse.json({ error: "Kegiatan mahasiswa tidak ditemukan." }, { status: 404 });
    }

    const formData = await request.formData();
    const files = getImageFiles(formData);

    if (files.length === 0) {
      return NextResponse.json({ error: "Tidak ada gambar yang dikirim." }, { status: 400 });
    }

    if (files.length > MAX_HOME_ACTIVITY_IMAGES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_HOME_ACTIVITY_IMAGES} gambar per kegiatan.` },
        { status: 400 }
      );
    }

    const alts = getStringArray(formData, "imageAlts");
    const fits = getStringArray(formData, "imageFits");
    const covers = getStringArray(formData, "isCovers");

    const images = await addHomeActivityImages(
      activityId,
      files.map((file, index) => ({
        file,
        altText: alts[index] || null,
        imageFit: fits[index] || null,
        isCover: covers[index] === "true",
      }))
    );

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity Image: Add ${files.length} image(s) to #${activityId}`,
    });

    return NextResponse.json({ data: images, message: "Gambar berhasil ditambahkan." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:home-activities:images:post`,
        "Gambar gagal ditambahkan."
      )
    );
  }
}

export async function handleHomeActivityImageUpdate(
  request: Request,
  rolePrefix: RolePrefix,
  activityId: string,
  imageId: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    if (!(await assertImageBelongsToActivity(activityId, imageId))) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageFile = formData.get("image");

      if (!(imageFile instanceof File) || imageFile.size === 0) {
        return NextResponse.json({ error: "Gambar pengganti tidak ditemukan." }, { status: 400 });
      }

      const image = await replaceHomeActivityImage(activityId, imageId, imageFile, {
        altText: typeof formData.get("imageAlt") === "string" ? String(formData.get("imageAlt")) : undefined,
        imageFit: typeof formData.get("imageFit") === "string" ? String(formData.get("imageFit")) : undefined,
      });

      await writeAuditLog({
        actor: auth.user,
        request,
        action: `Home Activity Image: Replace #${imageId}`,
      });

      return NextResponse.json({ data: image, message: "Gambar berhasil diganti." });
    }

    const body = (await request.json().catch(() => ({}))) as {
      imageAlt?: string | null;
      imageFit?: string | null;
      sortOrder?: number | string | null;
    };
    const supportedFields = new Set(["imageAlt", "imageFit", "sortOrder"]);

    for (const key of Object.keys(body)) {
      if (!supportedFields.has(key)) {
        return NextResponse.json({ error: `Field ${key} tidak didukung.` }, { status: 400 });
      }
    }

    const image = await updateHomeActivityImageMetadata(imageId, {
      altText: body.imageAlt,
      imageFit: body.imageFit,
      sortOrder: body.sortOrder,
    });

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity Image: Update #${imageId}`,
    });

    return NextResponse.json({ data: image, message: "Gambar berhasil diperbarui." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:home-activities:image:patch`,
        "Gambar gagal diperbarui."
      )
    );
  }
}

export async function handleHomeActivityImageDelete(
  request: Request,
  rolePrefix: RolePrefix,
  activityId: string,
  imageId: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    if (!(await assertImageBelongsToActivity(activityId, imageId))) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    await deleteHomeActivityImage(imageId);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity Image: Delete #${imageId}`,
    });

    return NextResponse.json({ message: "Gambar berhasil dihapus." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:home-activities:image:delete`,
        "Gambar gagal dihapus."
      )
    );
  }
}

export async function handleHomeActivityImageSetCover(
  request: Request,
  rolePrefix: RolePrefix,
  activityId: string,
  imageId: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    if (!(await assertImageBelongsToActivity(activityId, imageId))) {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
    }

    await setHomeActivityImageCover(activityId, imageId);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity Image: Set Cover #${imageId}`,
    });

    return NextResponse.json({ message: "Cover berhasil diperbarui." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:home-activities:image-cover:post`,
        "Cover gagal diperbarui."
      )
    );
  }
}
