import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const DATABASE_UNAVAILABLE_MESSAGE =
  "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.";

type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isDatabaseUnavailableError(error: unknown) {
  const message = getSafeErrorMessage(error);
  const cause =
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause !== "undefined"
      ? getSafeErrorMessage(error.cause)
      : "";
  const combined = `${message}\n${cause}`;

  if (isPrismaKnownError(error)) {
    if (["P1001", "P1002", "P2024"].includes(error.code)) {
      return true;
    }

    if (
      error.code === "P2010" &&
      /pool timeout|ECONNREFUSED|ETIMEDOUT|ECONNRESET|45028/i.test(combined)
    ) {
      return true;
    }
  }

  return /pool timeout|failed to retrieve a connection|Timed out fetching a new connection|Can't reach database server|Can't reach database|Connection refused|connect ECONNREFUSED|ECONNREFUSED|ETIMEDOUT|ECONNRESET|read ECONNRESET|45028/i.test(
    combined,
  );
}

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}

export function toApiErrorResponse(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan pada server.",
): { status: number; body: ApiErrorBody } {
  if (isDatabaseUnavailableError(error)) {
    return {
      status: 503,
      body: {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: DATABASE_UNAVAILABLE_MESSAGE,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: fallbackMessage,
      },
    },
  };
}

export function jsonApiError(
  error: unknown,
  context: string,
  fallbackMessage?: string,
) {
  logServerError(context, error);
  const response = toApiErrorResponse(error, fallbackMessage);

  return NextResponse.json(response.body, { status: response.status });
}

export { DATABASE_UNAVAILABLE_MESSAGE };
