import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getHomeLinksState } from "@/lib/home-links";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const state = await getHomeLinksState();

    return NextResponse.json({ data: state });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:home-links:get",
      "Pengaturan beranda gagal dimuat."
    );
  }
}
