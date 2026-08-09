import {
  InformationPostValidationError,
  InformationTableUnavailableError,
  type InformationPostInput,
  type InformationPostStatus,
} from "@/lib/information-posts";
import {
  InformationImageUploadError,
  saveInformationImage,
  validateInformationImage,
} from "@/lib/information-image-upload";
import {
  addInformationPostImages,
  InformationPostImageError,
  normalizeInformationImageFit,
  type InformationImageFit,
} from "@/lib/information-post-images";

function isMultipartRequest(request: Request) {
  return request.headers.get("content-type")?.includes("multipart/form-data");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getFormBoolean(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return fallback;
  }

  return value;
}

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

export async function parseInformationPostRequest(
  request: Request,
  actor: string
) {
  if (!isMultipartRequest(request)) {
    const body = (await request.json()) as InformationPostInput;
    return {
      input: {
        ...body,
        actor,
      },
      files: [],
      imageFits: [],
    };
  }

  const formData = await request.formData();
  const status = getFormString(formData, "status") || "draft";

  return {
    input: {
      title: getFormString(formData, "title"),
      category: getFormString(formData, "category"),
      summary: getFormString(formData, "summary"),
      content: getFormString(formData, "content"),
      status: status as InformationPostStatus,
      featured: getFormBoolean(formData, "featured", "false"),
      isActive: getFormBoolean(formData, "isActive", "true"),
      displayStartAt: getFormString(formData, "displayStartAt") || null,
      displayEndAt: getFormString(formData, "displayEndAt") || null,
      actor,
    },
    files: getImageFiles(formData),
    imageFits: getImageFits(formData),
  };
}

export async function saveInformationImagesForPost(
  postId: string,
  files: File[],
  imageFits: InformationImageFit[] = []
) {
  if (files.length === 0) {
    return;
  }

  if (files.length > 5) {
    throw new InformationImageUploadError("Maksimal 5 gambar per informasi.");
  }

  files.forEach(validateInformationImage);
  const savedImages = [];

  for (const file of files) {
    savedImages.push(await saveInformationImage(file));
  }

  await addInformationPostImages(postId, savedImages, imageFits);
}

export function getInformationApiErrorStatus(error: unknown) {
  if (
    error instanceof InformationPostValidationError ||
    error instanceof InformationTableUnavailableError ||
    error instanceof InformationImageUploadError ||
    error instanceof InformationPostImageError
  ) {
    return {
      message: error.message,
      statusCode: "statusCode" in error ? error.statusCode : 400,
    };
  }

  return null;
}
