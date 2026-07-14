import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getPublicProfileOrganizationTree } from "@/lib/profile-cms";

export async function GET() {
  try {
    const tree = await getPublicProfileOrganizationTree();

    return NextResponse.json({ data: tree });
  } catch (error) {
    return jsonApiError(
      error,
      "api:profile:organization:get",
      "Struktur organisasi gagal dimuat."
    );
  }
}
