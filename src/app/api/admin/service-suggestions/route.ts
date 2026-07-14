import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getServiceSuggestions } from "@/lib/service-suggestions";

export async function GET() {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const suggestions = await getServiceSuggestions();

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:service-suggestions:get",
      "Usulan layanan gagal dimuat.",
    );
  }
}
