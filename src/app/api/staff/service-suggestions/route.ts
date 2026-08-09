import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getServiceSuggestions,
  parseServiceSuggestionSort,
} from "@/lib/service-suggestions";

export async function GET(request: Request) {
  const user = await requireRole(["STAFF"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const sort = parseServiceSuggestionSort(url.searchParams.get("sort"));
    const suggestions = await getServiceSuggestions({ sort });

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:service-suggestions:get",
      "Usulan layanan gagal dimuat.",
    );
  }
}
