import {
  HomeLinksTableUnavailableError,
  HomeLinkValidationError,
  type HomeLinkInput,
} from "@/lib/home-links";

const supportedFields = new Set(["url", "isActive"]);

function assertSupportedFields(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HomeLinkValidationError("Payload link beranda tidak valid.");
  }

  for (const key of Object.keys(body)) {
    if (!supportedFields.has(key)) {
      throw new HomeLinkValidationError(`Field ${key} tidak didukung.`);
    }
  }
}

export async function parseAcademicCalendarRequest(
  request: Request,
  actor: string
): Promise<HomeLinkInput> {
  const body = (await request.json()) as HomeLinkInput;
  assertSupportedFields(body);

  return {
    url: body.url,
    isActive: body.isActive,
    actor,
  };
}

export function getHomeLinkApiErrorStatus(error: unknown) {
  if (
    error instanceof HomeLinkValidationError ||
    error instanceof HomeLinksTableUnavailableError
  ) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return null;
}
