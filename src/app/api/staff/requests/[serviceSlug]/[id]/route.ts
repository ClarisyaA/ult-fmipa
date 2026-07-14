import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getRequestDetail } from "@/lib/legacy-request-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceSlug: string; id: string }> }
) {
  try {
    const { serviceSlug, id } = await params;
    const requestDetail = await getRequestDetail(serviceSlug, id);

    if (!requestDetail) {
      return NextResponse.json(
        {
          error: "Request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: requestDetail,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:requests:detail:get",
      "Detail pengajuan gagal dimuat."
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Staff tidak memiliki akses untuk menghapus pengajuan." },
    { status: 403 }
  );
}
