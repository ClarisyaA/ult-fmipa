import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getServiceLinksState } from "@/lib/service-links";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["admin", "staff"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const state = await getServiceLinksState();

    return NextResponse.json({
      data: state,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:service-links:get",
      "Link layanan gagal dimuat."
    );
  }
}
