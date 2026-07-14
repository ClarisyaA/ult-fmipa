import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getStudentRequestHistory } from "@/lib/student-request-history";
import type { RequestStatus } from "@/types/request";

const statuses = new Set<RequestStatus>([
  "pending",
  "inProgress",
  "completed",
  "delivered",
  "sikApprovalPending",
  "sikApprovalRejected",
  "sikApprovalVerified",
  "sikFinalSubmitted",
]);

function parseStatus(value: string | null) {
  if (!value || !statuses.has(value as RequestStatus)) {
    return undefined;
  }

  return value as RequestStatus;
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  try {
    const result = await getStudentRequestHistory({
      npm: session.user.npm,
      status: parseStatus(searchParams.get("status")),
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonApiError(
      error,
      "api:student:requests:get",
      "Riwayat pengajuan gagal dimuat."
    );
  }
}
