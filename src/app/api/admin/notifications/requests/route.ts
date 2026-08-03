import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getRequestNotificationSnapshot } from "@/lib/legacy-request-stats";

export async function GET() {
  const user = await requireRole(["ADMIN"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await getRequestNotificationSnapshot();

    return NextResponse.json({ data });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:notifications:requests",
      "Notifikasi pengajuan gagal dimuat.",
    );
  }
}
