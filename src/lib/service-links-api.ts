import {
  ServiceLinksTableUnavailableError,
  ServiceLinkValidationError,
  type ServiceLinkInput,
} from "@/lib/service-links";

const supportedFields = new Set(["url", "isActive"]);

function assertSupportedFields(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ServiceLinkValidationError("Payload link layanan tidak valid.");
  }

  for (const key of Object.keys(body)) {
    if (!supportedFields.has(key)) {
      throw new ServiceLinkValidationError(`Field ${key} tidak didukung.`);
    }
  }
}

export async function parseScholarshipTemplateLinkRequest(
  request: Request,
  actor: string
): Promise<ServiceLinkInput> {
  const body = (await request.json()) as ServiceLinkInput;
  assertSupportedFields(body);

  return {
    url: body.url,
    isActive: body.isActive,
    actor,
  };
}

export function getServiceLinkApiErrorStatus(error: unknown) {
  if (
    error instanceof ServiceLinkValidationError ||
    error instanceof ServiceLinksTableUnavailableError
  ) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return null;
}
