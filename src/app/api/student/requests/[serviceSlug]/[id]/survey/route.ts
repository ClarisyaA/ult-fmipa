import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  createOrUpdateSurvey,
  getSurveyForRequest,
  SurveyTableUnavailableError,
} from "@/lib/service-surveys";
import {
  parseSurveyPayload,
  type SurveyPayload,
} from "@/lib/service-survey-validation";
import { getStudentRequestDetail } from "@/lib/student-request-history";

type SurveyRouteProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

const completedStatuses = new Set(["completed", "delivered"]);

async function getOwnedRequestOrResponse(
  npm: string,
  serviceSlug: string,
  id: string
) {
  let detail;

  try {
    detail = await getStudentRequestDetail(npm, serviceSlug, id);
  } catch (error) {
    return {
      response: jsonApiError(
        error,
        "api:student:request-survey:detail",
        "Pengajuan survei gagal dimuat."
      ),
    };
  }

  if (!detail) {
    return {
      response: NextResponse.json(
        { error: "Pengajuan tidak ditemukan." },
        { status: 404 }
      ),
    };
  }

  return {
    detail,
  };
}

async function getStudentSessionOrResponse() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "MAHASISWA") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!session.user.npm) {
    return {
      response: NextResponse.json(
        { error: "NPM mahasiswa tidak tersedia di session." },
        { status: 400 }
      ),
    };
  }

  return {
    npm: session.user.npm,
  };
}

export async function GET(_request: Request, { params }: SurveyRouteProps) {
  const sessionResult = await getStudentSessionOrResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { serviceSlug, id } = await params;
  const requestResult = await getOwnedRequestOrResponse(
    sessionResult.npm,
    serviceSlug,
    id
  );

  if (requestResult.response) {
    return requestResult.response;
  }

  try {
    const survey = await getSurveyForRequest(
      requestResult.detail.serviceSlug,
      requestResult.detail.sourceTable,
      requestResult.detail.id,
      sessionResult.npm
    );

    return NextResponse.json({
      data: survey,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:student:request-survey:get",
      "Survei kepuasan gagal dimuat."
    );
  }
}

export async function POST(request: Request, { params }: SurveyRouteProps) {
  const sessionResult = await getStudentSessionOrResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { serviceSlug, id } = await params;
  const requestResult = await getOwnedRequestOrResponse(
    sessionResult.npm,
    serviceSlug,
    id
  );

  if (requestResult.response) {
    return requestResult.response;
  }

  if (!completedStatuses.has(requestResult.detail.status)) {
    return NextResponse.json(
      {
        error: "Survei dapat diisi setelah layanan selesai diproses.",
      },
      { status: 400 }
    );
  }

  const payload = (await request.json().catch(() => ({}))) as SurveyPayload;
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
      serviceSlug: requestResult.detail.serviceSlug,
      sourceTable: requestResult.detail.sourceTable,
      requestId: requestResult.detail.id,
      npm: sessionResult.npm,
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
      "api:student:request-survey:post",
      "Survei kepuasan gagal disimpan."
    );
  }
}
