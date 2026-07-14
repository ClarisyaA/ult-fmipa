import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getServiceSuggestionById,
  parseServiceSuggestionId,
  parseServiceSuggestionUpdateInput,
  ServiceSuggestionNotFoundError,
  ServiceSuggestionValidationError,
  updateServiceSuggestion,
} from "@/lib/service-suggestions";

function validationResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const suggestion = await getServiceSuggestionById(parseServiceSuggestionId(id));

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    if (error instanceof ServiceSuggestionValidationError) {
      return validationResponse(error.message);
    }

    if (error instanceof ServiceSuggestionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return jsonApiError(
      error,
      "api:staff:service-suggestions:id:get",
      "Usulan layanan gagal dimuat.",
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return validationResponse("Payload pembaruan usulan layanan tidak valid.");
    }

    const suggestion = await updateServiceSuggestion(
      parseServiceSuggestionId(id),
      parseServiceSuggestionUpdateInput(body),
    );

    return NextResponse.json({
      data: suggestion,
      message: "Status usulan layanan berhasil diperbarui.",
    });
  } catch (error) {
    if (error instanceof ServiceSuggestionValidationError) {
      return validationResponse(error.message);
    }

    if (error instanceof ServiceSuggestionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return jsonApiError(
      error,
      "api:staff:service-suggestions:id:patch",
      "Status usulan layanan gagal diperbarui.",
    );
  }
}
