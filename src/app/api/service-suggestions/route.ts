import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  createServiceSuggestion,
  parseServiceSuggestionInput,
  ServiceSuggestionValidationError,
} from "@/lib/service-suggestions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Payload usulan layanan tidak valid.",
          },
        },
        { status: 400 },
      );
    }

    const input = parseServiceSuggestionInput(
      body,
      session?.user.role === "student" ? session.user.npm : null,
    );
    const id = await createServiceSuggestion(input);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    if (error instanceof ServiceSuggestionValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        { status: 400 },
      );
    }

    return jsonApiError(
      error,
      "api:service-suggestions:post",
      "Usulan layanan gagal dikirim.",
    );
  }
}
