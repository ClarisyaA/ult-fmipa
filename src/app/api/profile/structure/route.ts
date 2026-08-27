import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getPublicProfileStructure } from "@/lib/profile-structure-cms";

export async function GET() {
  try {
    const { settings, layout } = await getPublicProfileStructure();

    return NextResponse.json(
      { data: { settings, layout } },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    return jsonApiError(
      error,
      "api:profile:structure:get",
      "Struktur profil gagal dimuat."
    );
  }
}
