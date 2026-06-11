import { NextResponse } from "next/server";

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
