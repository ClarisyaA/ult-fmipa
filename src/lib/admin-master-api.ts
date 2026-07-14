import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";

export type AdminValidationResult =
  | { ok: true; user: Session["user"] }
  | { ok: false; response: NextResponse };

export class AdminActionError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "VALIDATION_ERROR",
  ) {
    super(message);
  }
}

export async function requireAdminApi(): Promise<AdminValidationResult> {
  const user = await requireRole(["admin"]);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Akses admin diperlukan.",
          },
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}

export function validationError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status === 404 ? "NOT_FOUND" : "VALIDATION_ERROR",
        message,
      },
    },
    { status },
  );
}

export function successJson<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AdminActionError("Format JSON tidak valid.");
  }
}

export function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function nullableString(value: unknown, maxLength: number) {
  const next = cleanString(value, maxLength);
  return next || null;
}

export function parseOptionalInt(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new AdminActionError("Nilai angka tidak valid.");
  }

  return parsed;
}

export function handleAdminApiError(
  error: unknown,
  context: string,
  fallbackMessage: string,
) {
  if (error instanceof AdminActionError) {
    return validationError(error.message, error.statusCode);
  }

  return jsonApiError(error, context, fallbackMessage);
}
