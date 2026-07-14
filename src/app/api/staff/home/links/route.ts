import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getHomeLinksState } from "@/lib/home-links";

async function requireStaffAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!["admin", "staff"].includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

export async function GET() {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const state = await getHomeLinksState();

    return NextResponse.json({ data: state });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:home-links:get",
      "Pengaturan beranda gagal dimuat."
    );
  }
}
