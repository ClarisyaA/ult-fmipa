import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getProfileLocationSettings } from "@/lib/profile-cms";

export async function GET() {
  try {
    const location = await getProfileLocationSettings(true);

    return NextResponse.json({ data: location });
  } catch (error) {
    return jsonApiError(error, "api:profile:location:get", "Data lokasi gagal dimuat.");
  }
}
