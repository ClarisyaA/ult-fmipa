import { NextResponse } from "next/server";

import {
  RequestStatusUpdateError,
  updateRequestStatus,
} from "@/lib/legacy-request-status";
import { jsonApiError } from "@/lib/error-utils";
import type { UpdateRequestStatusInput } from "@/types/request-action";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ serviceSlug: string; id: string }> }
) {
  try {
    const { serviceSlug, id } = await params;
    const body = (await request.json()) as UpdateRequestStatusInput;
    const updatedRequestDetail = await updateRequestStatus(
      serviceSlug,
      id,
      body
    );

    return NextResponse.json({
      data: updatedRequestDetail,
      message: "Status pengajuan berhasil diperbarui.",
    });
  } catch (error) {
    if (error instanceof RequestStatusUpdateError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:admin:requests:status:patch",
      "Status pengajuan gagal diperbarui."
    );
  }
}
