import { NextResponse } from "next/server";

import {
  getServiceRequestList,
  parseRequestStatus,
} from "@/lib/legacy-request-list";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const service = searchParams.get("service") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const status = parseRequestStatus(searchParams.get("status"));
    const result = await getServiceRequestList({
      service,
      status,
      q,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load request list",
        message: String(error),
      },
      { status: 500 }
    );
  }
}
