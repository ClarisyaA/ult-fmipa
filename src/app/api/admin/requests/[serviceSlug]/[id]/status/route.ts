import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
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
    const user = await getCurrentUser();
    const updatedRequestDetail = await updateRequestStatus(
      serviceSlug,
      id,
      body
    );
    await writeAuditLog({
      actor: user,
      request,
      action: `Pengajuan: ${body.action} pengajuan layanan: ${serviceSlug} #${id}`,
    });

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
