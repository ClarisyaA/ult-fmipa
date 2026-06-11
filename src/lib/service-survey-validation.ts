export type SurveyPayload = {
  ratingTangibility?: unknown;
  ratingReliability?: unknown;
  ratingResponsiveness?: unknown;
  ratingAssurance?: unknown;
  ratingEmpathy?: unknown;
  overallRating?: unknown;
  comment?: unknown;
};

export type ParsedSurveyPayload =
  | {
      data: {
        ratingTangibility: number | null;
        ratingReliability: number | null;
        ratingResponsiveness: number | null;
        ratingAssurance: number | null;
        ratingEmpathy: number | null;
        overallRating: number;
        comment: string;
      };
    }
  | {
      issue: {
        field: string;
        message: string;
      };
    };

type RatingParseResult =
  | {
      value: number | null;
    }
  | {
      issue: {
        field: string;
        message: string;
      };
    };

function hasRatingIssue(
  result: RatingParseResult
): result is Extract<RatingParseResult, { issue: { field: string } }> {
  return "issue" in result;
}

function getRatingValue(result: RatingParseResult) {
  return hasRatingIssue(result) ? null : result.value;
}

function parseOptionalRating(value: unknown, field: string): RatingParseResult {
  if (value === undefined || value === null || value === "") {
    return {
      value: null,
    };
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 5) {
    return {
      issue: {
        field,
        message: `${field} harus bernilai 1 sampai 5.`,
      },
    };
  }

  return {
    value: numberValue,
  };
}

function parseRequiredRating(value: unknown, field: string): RatingParseResult {
  const parsed = parseOptionalRating(value, field);

  if (hasRatingIssue(parsed)) {
    return parsed;
  }

  if (parsed.value === null) {
    return {
      issue: {
        field,
        message: "Rating keseluruhan wajib diisi.",
      },
    };
  }

  return parsed;
}

export function parseSurveyPayload(payload: SurveyPayload): ParsedSurveyPayload {
  const ratingTangibility = parseOptionalRating(
    payload.ratingTangibility,
    "ratingTangibility"
  );
  const ratingReliability = parseOptionalRating(
    payload.ratingReliability,
    "ratingReliability"
  );
  const ratingResponsiveness = parseOptionalRating(
    payload.ratingResponsiveness,
    "ratingResponsiveness"
  );
  const ratingAssurance = parseOptionalRating(
    payload.ratingAssurance,
    "ratingAssurance"
  );
  const ratingEmpathy = parseOptionalRating(payload.ratingEmpathy, "ratingEmpathy");
  const overallRating = parseRequiredRating(payload.overallRating, "overallRating");
  const issue = [
    ratingTangibility,
    ratingReliability,
    ratingResponsiveness,
    ratingAssurance,
    ratingEmpathy,
    overallRating,
  ].find(hasRatingIssue)?.issue;

  if (issue) {
    return {
      issue,
    };
  }

  const overallRatingValue = getRatingValue(overallRating);

  if (overallRatingValue === null) {
    return {
      issue: {
        field: "overallRating",
        message: "Rating keseluruhan wajib diisi.",
      },
    };
  }

  const comment = typeof payload.comment === "string" ? payload.comment.trim() : "";

  if (comment.length > 500) {
    return {
      issue: {
        field: "comment",
        message: "Komentar maksimal 500 karakter.",
      },
    };
  }

  return {
    data: {
      ratingTangibility: getRatingValue(ratingTangibility),
      ratingReliability: getRatingValue(ratingReliability),
      ratingResponsiveness: getRatingValue(ratingResponsiveness),
      ratingAssurance: getRatingValue(ratingAssurance),
      ratingEmpathy: getRatingValue(ratingEmpathy),
      overallRating: overallRatingValue,
      comment,
    },
  };
}
