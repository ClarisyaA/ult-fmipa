import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  deleteServiceRequest,
  RequestDeleteError,
} from "@/lib/legacy-request-delete";
import { getRequestDetail } from "@/lib/legacy-request-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceSlug: string; id: string }> }
) {
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
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ serviceSlug: string; id: string }> }
) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { serviceSlug, id } = await params;
    await deleteServiceRequest(serviceSlug, id);

    return NextResponse.json({
      message: "Pengajuan berhasil dihapus.",
    });
  } catch (error) {
    if (error instanceof RequestDeleteError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Pengajuan gagal dihapus." },
      { status: 500 }
    );
  }
}
