import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getInformationApiErrorStatus,
  parseInformationPostRequest,
  saveInformationImagesForPost,
} from "@/lib/information-api";
import {
  createInformationPost,
} from "@/lib/information-posts";
import { getStaffInformationApiData } from "@/lib/staff-api-data";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Staff ULT";
}

export async function GET() {
  try {
    const result = await getStaffInformationApiData();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:information:get",
      "Informasi gagal dimuat."
    );
  }
}

export async function POST(request: Request) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { input, files } = await parseInformationPostRequest(
      request,
      getActorName(user)
    );
    const post = await createInformationPost(input);

    if (post) {
      await saveInformationImagesForPost(post.id, files);
    }

    return NextResponse.json({
      data: post,
      message: "Informasi berhasil dibuat.",
    });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:staff:information:post",
      "Informasi gagal dibuat."
    );
  }
}
