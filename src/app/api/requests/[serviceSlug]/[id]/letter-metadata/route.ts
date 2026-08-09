import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getLetterMetadata,
  LetterMetadataError,
  updateLetterMetadata,
} from "@/lib/letters/letter-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type LetterMetadataRouteProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
      },
    },
    { status },
  );
}

async function authorize() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: jsonError("Unauthorized", 401),
    };
  }

  if (!["ADMIN", "STAFF"].includes(user.role)) {
    return {
      user,
      response: jsonError("Forbidden", 403),
    };
  }

  return { user, response: null };
}

export async function GET(_request: Request, { params }: LetterMetadataRouteProps) {
  const auth = await authorize();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { serviceSlug, id } = await params;
    const metadata = await getLetterMetadata(serviceSlug, id);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    if (error instanceof LetterMetadataError) {
      return jsonError(error.message, error.statusCode);
    }

    return jsonApiError(
      error,
      "api:requests:letter-metadata:get",
      "Data surat gagal dimuat.",
    );
  }
}

export async function PATCH(request: Request, { params }: LetterMetadataRouteProps) {
  const auth = await authorize();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { serviceSlug, id } = await params;
    const payload = await request.json();
    const metadata = await updateLetterMetadata({
      serviceSlug,
      id,
      payload,
      actor: auth.user,
      request,
    });

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Payload tidak valid.", 400);
    }

    if (error instanceof LetterMetadataError) {
      return jsonError(error.message, error.statusCode);
    }

    return jsonApiError(
      error,
      "api:requests:letter-metadata:patch",
      "Data surat gagal disimpan.",
    );
  }
}
