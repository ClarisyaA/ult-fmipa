import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getSurveySummary } from "@/lib/service-surveys";

export async function GET() {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await getSurveySummary("admin");

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:surveys:summary:get",
      "Ringkasan survei gagal dimuat."
    );
  }
}
