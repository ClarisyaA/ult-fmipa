import {
  HomeActivityTableUnavailableError,
  HomeActivityValidationError,
  type HomeActivityInput,
} from "@/lib/home-activities";
import {
  HomeActivityImageUploadError,
  validateHomeActivityImage,
} from "@/lib/home-activity-image-upload";

function isMultipartRequest(request: Request) {
  return request.headers.get("content-type")?.includes("multipart/form-data");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getImageFile(formData: FormData) {
  const value = formData.get("image");

  return value instanceof File && value.size > 0 ? value : null;
}

export async function parseHomeActivityRequest(request: Request, actor: string) {
  if (!isMultipartRequest(request)) {
    const body = (await request.json()) as HomeActivityInput;
    return {
      input: {
        ...body,
        actor,
      },
      imageFile: null,
    };
  }

  const formData = await request.formData();
  const file = getImageFile(formData);

  if (file) {
    validateHomeActivityImage(file);
  }

  return {
    input: {
      title: getFormString(formData, "title"),
      eyebrow: getFormString(formData, "eyebrow"),
      description: getFormString(formData, "description"),
      imageAlt: getFormString(formData, "imageAlt"),
      isActive: getFormString(formData, "isActive") || "false",
      sortOrder: getFormString(formData, "sortOrder") || "0",
      actor,
    },
    imageFile: file,
  };
}

export function getHomeActivityApiErrorStatus(error: unknown) {
  if (
    error instanceof HomeActivityValidationError ||
    error instanceof HomeActivityTableUnavailableError ||
    error instanceof HomeActivityImageUploadError
  ) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return null;
}
