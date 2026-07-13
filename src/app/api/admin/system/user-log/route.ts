import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-master-api";
import { getAdminUserLogRows } from "@/lib/admin-user-log";
import { jsonApiError } from "@/lib/error-utils";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await getAdminUserLogRows({
      search: searchParams.get("q") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:system:user-log:get",
      "User log gagal dimuat.",
    );
  }
}
