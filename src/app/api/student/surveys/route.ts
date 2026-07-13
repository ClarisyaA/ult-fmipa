import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  createOrUpdateSurvey,
  SurveyTableUnavailableError,
} from "@/lib/service-surveys";
import {
  parseSurveyPayload,
  type SurveyPayload,
} from "@/lib/service-survey-validation";
import { getStudentRequestDetail } from "@/lib/student-request-history";

type StudentSurveyPayload = SurveyPayload & {
  serviceSlug?: unknown;
  requestId?: unknown;
};

const completedStatuses = new Set(["completed", "delivered"]);

export async function POST(request: Request) {
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

  const payload = (await request.json().catch(() => ({}))) as StudentSurveyPayload;
  const serviceSlug =
    typeof payload.serviceSlug === "string" ? payload.serviceSlug : "";
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";

  if (!serviceSlug || !/^\d+$/.test(requestId)) {
    return NextResponse.json(
      { error: "Pengajuan survei tidak valid." },
      { status: 400 }
    );
  }

  let detail;

  try {
    detail = await getStudentRequestDetail(
      session.user.npm,
      serviceSlug,
      requestId
    );
  } catch (error) {
    return jsonApiError(
      error,
      "api:student:surveys:detail",
      "Pengajuan survei gagal dimuat."
    );
  }

  if (!detail) {
    return NextResponse.json(
      { error: "Pengajuan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!completedStatuses.has(detail.status)) {
    return NextResponse.json(
      {
        error: "Survei dapat diisi setelah layanan selesai diproses.",
      },
      { status: 400 }
    );
  }

  const parsed = parseSurveyPayload(payload);

  if ("issue" in parsed) {
    return NextResponse.json(
      {
        error: parsed.issue.message,
        issues: [parsed.issue],
      },
      { status: 400 }
    );
  }

  try {
    const survey = await createOrUpdateSurvey({
      serviceSlug: detail.serviceSlug,
      sourceTable: detail.sourceTable,
      requestId: detail.id,
      npm: session.user.npm,
      ...parsed.data,
    });

    if (!survey) {
      return NextResponse.json(
        { error: "Survei kepuasan gagal disimpan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: survey,
      message: "Survei kepuasan berhasil disimpan.",
    });
  } catch (error) {
    if (error instanceof SurveyTableUnavailableError) {
      return NextResponse.json(
        { error: "Tabel survei belum tersedia di database lokal." },
        { status: 503 }
      );
    }

    return jsonApiError(
      error,
      "api:student:surveys:post",
      "Survei kepuasan gagal disimpan."
    );
  }
}
