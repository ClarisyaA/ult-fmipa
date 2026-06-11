import { getPublicServiceBySlug, getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import { getStudentRequestHistory } from "@/lib/student-request-history";

export type ServiceSurvey = {
  id: string;
  serviceSlug: string;
  sourceTable: string;
  requestId: string;
  npm: string;
  ratingTangibility: number | null;
  ratingReliability: number | null;
  ratingResponsiveness: number | null;
  ratingAssurance: number | null;
  ratingEmpathy: number | null;
  overallRating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type PendingSurveyRequest = {
  id: string;
  serviceSlug: string;
  sourceTable: string;
  serviceTitle: string;
  requestDate: string | null;
  status: "completed" | "delivered";
  statusLabel: string;
};

export type StudentSurveyRequest = PendingSurveyRequest & {
  hasSurvey: boolean;
};

export type StudentSurveyRequests = {
  pending: StudentSurveyRequest[];
  submitted: StudentSurveyRequest[];
  tableAvailable: boolean;
};

export type ServiceSurveyInput = {
  serviceSlug: string;
  sourceTable: string;
  requestId: string;
  npm: string;
  ratingTangibility?: number | null;
  ratingReliability?: number | null;
  ratingResponsiveness?: number | null;
  ratingAssurance?: number | null;
  ratingEmpathy?: number | null;
  overallRating: number;
  comment?: string | null;
};

type SurveyRecord = {
  ID: bigint | number | string;
  SERVICE_SLUG: string;
  SOURCE_TABLE: string;
  REQUEST_ID: bigint | number | string;
  NPM: string;
  RATING_TANGIBILITY: number | null;
  RATING_RELIABILITY: number | null;
  RATING_RESPONSIVENESS: number | null;
  RATING_ASSURANCE: number | null;
  RATING_EMPATHY: number | null;
  OVERALL_RATING: number;
  COMMENT: string | null;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
};

type SummaryRow = {
  totalCount: bigint | number | null;
  averageOverallRating: number | string | null;
  averageTangibility: number | string | null;
  averageReliability: number | string | null;
  averageResponsiveness: number | string | null;
  averageAssurance: number | string | null;
  averageEmpathy: number | string | null;
};

type ServiceBreakdownRow = {
  SERVICE_SLUG: string;
  totalCount: bigint | number;
  averageOverallRating: number | string | null;
};

export type SurveySummary = {
  totalCount: number;
  averageOverallRating: number | null;
  averageTangibility: number | null;
  averageReliability: number | null;
  averageResponsiveness: number | null;
  averageAssurance: number | null;
  averageEmpathy: number | null;
  recentComments: Array<{
    id: string;
    serviceSlug: string;
    serviceTitle: string;
    overallRating: number;
    comment: string;
    createdAt: string;
  }>;
  serviceBreakdown: Array<{
    serviceSlug: string;
    serviceTitle: string;
    totalCount: number;
    averageOverallRating: number | null;
  }>;
};

const emptySummary: SurveySummary = {
  totalCount: 0,
  averageOverallRating: null,
  averageTangibility: null,
  averageReliability: null,
  averageResponsiveness: null,
  averageAssurance: null,
  averageEmpathy: null,
  recentComments: [],
  serviceBreakdown: [],
};

export class SurveyTableUnavailableError extends Error {
  constructor() {
    super(
      "Survey table is not available. Run database/migrations/002_create_ult_service_surveys.sql."
    );
    this.name = "SurveyTableUnavailableError";
  }
}

function ensureWhitelistedService(serviceSlug: string, sourceTable: string) {
  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || service.sourceTable !== sourceTable) {
    return null;
  }

  return service;
}

function toBigIntId(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error("ID pengajuan tidak valid.");
  }

  return BigInt(value);
}

function toNullableRating(value?: number | null) {
  return value ?? null;
}

function toNumber(value: bigint | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function roundAverage(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return Math.round(numericValue * 100) / 100;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toSurvey(record: SurveyRecord): ServiceSurvey {
  return {
    id: String(record.ID),
    serviceSlug: record.SERVICE_SLUG,
    sourceTable: record.SOURCE_TABLE,
    requestId: String(record.REQUEST_ID),
    npm: record.NPM,
    ratingTangibility: record.RATING_TANGIBILITY,
    ratingReliability: record.RATING_RELIABILITY,
    ratingResponsiveness: record.RATING_RESPONSIVENESS,
    ratingAssurance: record.RATING_ASSURANCE,
    ratingEmpathy: record.RATING_EMPATHY,
    overallRating: record.OVERALL_RATING,
    comment: record.COMMENT,
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
  };
}

function isMissingSurveyTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_service_surveys") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnMissingSurveyTable() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Survey table is not available. Run database/migrations/002_create_ult_service_surveys.sql."
    );
  }
}

function handleSurveyReadError(error: unknown) {
  if (isMissingSurveyTableError(error)) {
    warnMissingSurveyTable();
    return;
  }

  throw error;
}

function serviceTitleBySlug() {
  return Object.fromEntries(
    getPublicServices().map((service) => [service.slug, service.title])
  );
}

async function hasSurveyTable() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM ult_service_surveys LIMIT 1`;
    return true;
  } catch (error) {
    handleSurveyReadError(error);
    return false;
  }
}

export async function getSurveyForRequest(
  serviceSlug: string,
  sourceTable: string,
  requestId: string,
  npm: string
) {
  if (!ensureWhitelistedService(serviceSlug, sourceTable)) {
    return null;
  }

  try {
    const records = await prisma.$queryRaw<SurveyRecord[]>`
      SELECT
        ID,
        SERVICE_SLUG,
        SOURCE_TABLE,
        REQUEST_ID,
        NPM,
        RATING_TANGIBILITY,
        RATING_RELIABILITY,
        RATING_RESPONSIVENESS,
        RATING_ASSURANCE,
        RATING_EMPATHY,
        OVERALL_RATING,
        COMMENT,
        CREATED_AT,
        UPDATED_AT
      FROM ult_service_surveys
      WHERE SERVICE_SLUG = ${serviceSlug}
        AND SOURCE_TABLE = ${sourceTable}
        AND REQUEST_ID = ${toBigIntId(requestId)}
        AND NPM = ${npm}
      LIMIT 1
    `;

    return records[0] ? toSurvey(records[0]) : null;
  } catch (error) {
    handleSurveyReadError(error);
    return null;
  }
}

export async function createOrUpdateSurvey(input: ServiceSurveyInput) {
  if (!ensureWhitelistedService(input.serviceSlug, input.sourceTable)) {
    throw new Error("Layanan survei tidak valid.");
  }

  const requestId = toBigIntId(input.requestId);

  try {
    await prisma.$executeRaw`
      INSERT INTO ult_service_surveys (
        SERVICE_SLUG,
        SOURCE_TABLE,
        REQUEST_ID,
        NPM,
        RATING_TANGIBILITY,
        RATING_RELIABILITY,
        RATING_RESPONSIVENESS,
        RATING_ASSURANCE,
        RATING_EMPATHY,
        OVERALL_RATING,
        COMMENT
      ) VALUES (
        ${input.serviceSlug},
        ${input.sourceTable},
        ${requestId},
        ${input.npm},
        ${toNullableRating(input.ratingTangibility)},
        ${toNullableRating(input.ratingReliability)},
        ${toNullableRating(input.ratingResponsiveness)},
        ${toNullableRating(input.ratingAssurance)},
        ${toNullableRating(input.ratingEmpathy)},
        ${input.overallRating},
        ${input.comment?.trim() || null}
      )
      ON DUPLICATE KEY UPDATE
        RATING_TANGIBILITY = VALUES(RATING_TANGIBILITY),
        RATING_RELIABILITY = VALUES(RATING_RELIABILITY),
        RATING_RESPONSIVENESS = VALUES(RATING_RESPONSIVENESS),
        RATING_ASSURANCE = VALUES(RATING_ASSURANCE),
        RATING_EMPATHY = VALUES(RATING_EMPATHY),
        OVERALL_RATING = VALUES(OVERALL_RATING),
        COMMENT = VALUES(COMMENT),
        UPDATED_AT = CURRENT_TIMESTAMP(3)
    `;
  } catch (error) {
    if (isMissingSurveyTableError(error)) {
      warnMissingSurveyTable();
      throw new SurveyTableUnavailableError();
    }

    throw error;
  }

  return getSurveyForRequest(
    input.serviceSlug,
    input.sourceTable,
    input.requestId,
    input.npm
  );
}

export async function getRecentSurveyComments() {
  try {
    const rows = await prisma.$queryRaw<SurveyRecord[]>`
      SELECT
        ID,
        SERVICE_SLUG,
        SOURCE_TABLE,
        REQUEST_ID,
        NPM,
        RATING_TANGIBILITY,
        RATING_RELIABILITY,
        RATING_RESPONSIVENESS,
        RATING_ASSURANCE,
        RATING_EMPATHY,
        OVERALL_RATING,
        COMMENT,
        CREATED_AT,
        UPDATED_AT
      FROM ult_service_surveys
      WHERE COMMENT IS NOT NULL AND COMMENT <> ''
      ORDER BY CREATED_AT DESC
      LIMIT 5
    `;
    const titles = serviceTitleBySlug();

    return rows.flatMap((survey) => {
      if (!survey.COMMENT) {
        return [];
      }

      return [
        {
          id: String(survey.ID),
          serviceSlug: survey.SERVICE_SLUG,
          serviceTitle: titles[survey.SERVICE_SLUG] ?? survey.SERVICE_SLUG,
          overallRating: survey.OVERALL_RATING,
          comment: survey.COMMENT,
          createdAt: toIso(survey.CREATED_AT) ?? "",
        },
      ];
    });
  } catch (error) {
    handleSurveyReadError(error);
    return [];
  }
}

export async function getSurveySummary(role?: "admin" | "staff") {
  void role;

  try {
    const [summaryRows, recentComments, serviceGroups] = await Promise.all([
      prisma.$queryRaw<SummaryRow[]>`
        SELECT
          COUNT(*) AS totalCount,
          AVG(OVERALL_RATING) AS averageOverallRating,
          AVG(RATING_TANGIBILITY) AS averageTangibility,
          AVG(RATING_RELIABILITY) AS averageReliability,
          AVG(RATING_RESPONSIVENESS) AS averageResponsiveness,
          AVG(RATING_ASSURANCE) AS averageAssurance,
          AVG(RATING_EMPATHY) AS averageEmpathy
        FROM ult_service_surveys
      `,
      getRecentSurveyComments(),
      prisma.$queryRaw<ServiceBreakdownRow[]>`
        SELECT
          SERVICE_SLUG,
          COUNT(*) AS totalCount,
          AVG(OVERALL_RATING) AS averageOverallRating
        FROM ult_service_surveys
        GROUP BY SERVICE_SLUG
        ORDER BY totalCount DESC, SERVICE_SLUG ASC
      `,
    ]);
    const summary = summaryRows[0];
    const titles = serviceTitleBySlug();

    if (!summary) {
      return emptySummary;
    }

    return {
      totalCount: toNumber(summary.totalCount),
      averageOverallRating: roundAverage(summary.averageOverallRating),
      averageTangibility: roundAverage(summary.averageTangibility),
      averageReliability: roundAverage(summary.averageReliability),
      averageResponsiveness: roundAverage(summary.averageResponsiveness),
      averageAssurance: roundAverage(summary.averageAssurance),
      averageEmpathy: roundAverage(summary.averageEmpathy),
      recentComments,
      serviceBreakdown: serviceGroups.map((group) => ({
        serviceSlug: group.SERVICE_SLUG,
        serviceTitle: titles[group.SERVICE_SLUG] ?? group.SERVICE_SLUG,
        totalCount: toNumber(group.totalCount),
        averageOverallRating: roundAverage(group.averageOverallRating),
      })),
    };
  } catch (error) {
    handleSurveyReadError(error);
    return emptySummary;
  }
}

export async function getCompletedUnsurveyedRequestsForStudent(npm: string) {
  if (!(await hasSurveyTable())) {
    return null;
  }

  const [completed, delivered] = await Promise.all([
    getStudentRequestHistory({
      npm,
      status: "completed",
      limit: 25,
    }),
    getStudentRequestHistory({
      npm,
      status: "delivered",
      limit: 25,
    }),
  ]);
  const requests = [...completed.data, ...delivered.data]
    .flatMap((request) => {
      if (request.status !== "completed" && request.status !== "delivered") {
        return [];
      }

      return [
        {
          ...request,
          status: request.status,
        } satisfies PendingSurveyRequest,
      ];
    })
    .sort((a, b) => {
      const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
      const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;

      return dateB - dateA || Number(b.id) - Number(a.id);
    });

  for (const request of requests) {
    const survey = await getSurveyForRequest(
      request.serviceSlug,
      request.sourceTable,
      request.id,
      npm
    );

    if (!survey) {
      return {
        id: request.id,
        serviceSlug: request.serviceSlug,
        sourceTable: request.sourceTable,
        serviceTitle: request.serviceTitle,
        requestDate: request.requestDate,
        status: request.status,
        statusLabel: request.statusLabel,
      } satisfies PendingSurveyRequest;
    }
  }

  return null;
}

export async function getSurveyRequestsForStudent(
  npm: string
): Promise<StudentSurveyRequests> {
  const tableAvailable = await hasSurveyTable();

  if (!tableAvailable) {
    return {
      pending: [],
      submitted: [],
      tableAvailable: false,
    };
  }

  const [completed, delivered] = await Promise.all([
    getStudentRequestHistory({
      npm,
      status: "completed",
      limit: 50,
    }),
    getStudentRequestHistory({
      npm,
      status: "delivered",
      limit: 50,
    }),
  ]);
  const requests = [...completed.data, ...delivered.data]
    .flatMap((request) => {
      if (request.status !== "completed" && request.status !== "delivered") {
        return [];
      }

      return [
        {
          id: request.id,
          serviceSlug: request.serviceSlug,
          sourceTable: request.sourceTable,
          serviceTitle: request.serviceTitle,
          requestDate: request.requestDate,
          status: request.status,
          statusLabel: request.statusLabel,
        } satisfies PendingSurveyRequest,
      ];
    })
    .sort((a, b) => {
      const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
      const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;

      return dateB - dateA || Number(b.id) - Number(a.id);
    });
  const pending: StudentSurveyRequest[] = [];
  const submitted: StudentSurveyRequest[] = [];

  for (const request of requests) {
    const survey = await getSurveyForRequest(
      request.serviceSlug,
      request.sourceTable,
      request.id,
      npm
    );
    const item = {
      ...request,
      hasSurvey: Boolean(survey),
    };

    if (survey) {
      submitted.push(item);
    } else {
      pending.push(item);
    }
  }

  return {
    pending,
    submitted,
    tableAvailable: true,
  };
}
