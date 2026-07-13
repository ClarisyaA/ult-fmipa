import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getCompletedUnsurveyedRequestsForStudent } from "@/lib/service-surveys";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.npm) {
    return NextResponse.json(
      { error: "NPM mahasiswa tidak tersedia di session." },
      { status: 400 }
    );
  }

  try {
    const pendingRequest = await getCompletedUnsurveyedRequestsForStudent(
      session.user.npm
    );

    return NextResponse.json({
      data: pendingRequest,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:student:surveys:pending:get",
      "Daftar survei tertunda gagal dimuat."
    );
  }
}
