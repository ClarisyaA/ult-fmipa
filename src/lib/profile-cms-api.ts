import {
  getProfileApiErrorStatus,
  type ProfileLocationHourInput,
  type ProfileLocationInput,
  type ProfileOrganizationInput,
} from "@/lib/profile-cms";
import {
  ProfileImageUploadError,
  validateProfileImage,
  type ProfileImageType,
} from "@/lib/profile-image-upload";

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

function assertSupportedFields(
  keys: Iterable<string>,
  supportedFields: Set<string>
) {
  for (const key of keys) {
    if (!supportedFields.has(key)) {
      throw new ProfileImageUploadError(`Field ${key} tidak didukung.`);
    }
  }
}

const organizationFields = new Set([
  "parentId",
  "name",
  "positionTitle",
  "roleLabel",
  "photoAlt",
  "colorVariant",
  "isActive",
  "sortOrder",
  "image",
]);

const locationFields = new Set([
  "eyebrow",
  "title",
  "description",
  "directionLabel",
  "directionUrl",
  "email",
  "imageAlt",
  "imageFit",
  "isActive",
  "image",
]);

const hourFields = new Set(["dayLabel", "timeLabel", "sortOrder", "isActive"]);

export async function parseProfileOrganizationRequest(
  request: Request,
  actor: string
) {
  if (!isMultipartRequest(request)) {
    const body = (await request.json()) as ProfileOrganizationInput;
    assertSupportedFields(Object.keys(body ?? {}), organizationFields);
    return { input: { ...body, actor }, imageFile: null };
  }

  const formData = await request.formData();
  assertSupportedFields(formData.keys(), organizationFields);
  const imageFile = getImageFile(formData);

  if (imageFile) {
    validateProfileImage(imageFile, "organization");
  }

  return {
    input: {
      parentId: getFormString(formData, "parentId"),
      name: getFormString(formData, "name"),
      positionTitle: getFormString(formData, "positionTitle"),
      roleLabel: getFormString(formData, "roleLabel"),
      photoAlt: getFormString(formData, "photoAlt"),
      colorVariant: getFormString(formData, "colorVariant") || "emerald",
      isActive: getFormString(formData, "isActive") || "false",
      sortOrder: getFormString(formData, "sortOrder") || "0",
      actor,
    },
    imageFile,
  };
}

export async function parseProfileLocationRequest(request: Request, actor: string) {
  if (!isMultipartRequest(request)) {
    const body = (await request.json()) as ProfileLocationInput;
    assertSupportedFields(Object.keys(body ?? {}), locationFields);
    return { input: { ...body, actor }, imageFile: null };
  }

  const formData = await request.formData();
  assertSupportedFields(formData.keys(), locationFields);
  const imageFile = getImageFile(formData);

  if (imageFile) {
    validateProfileImage(imageFile, "location");
  }

  return {
    input: {
      eyebrow: getFormString(formData, "eyebrow"),
      title: getFormString(formData, "title"),
      description: getFormString(formData, "description"),
      directionLabel: getFormString(formData, "directionLabel"),
      directionUrl: getFormString(formData, "directionUrl"),
      email: getFormString(formData, "email"),
      imageAlt: getFormString(formData, "imageAlt"),
      imageFit: getFormString(formData, "imageFit") || "cover",
      isActive: getFormString(formData, "isActive") || "true",
      actor,
    },
    imageFile,
  };
}

export async function parseProfileLocationHourRequest(request: Request) {
  const body = (await request.json()) as ProfileLocationHourInput;
  assertSupportedFields(Object.keys(body ?? {}), hourFields);

  return {
    dayLabel: body.dayLabel,
    timeLabel: body.timeLabel,
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive ?? true,
  };
}

export function getProfileCmsApiErrorStatus(error: unknown) {
  if (error instanceof ProfileImageUploadError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return getProfileApiErrorStatus(error);
}

export function isProfileImageType(value: string): value is ProfileImageType {
  return value === "organization" || value === "location";
}
