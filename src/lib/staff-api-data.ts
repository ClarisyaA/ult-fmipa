import { requireRole } from "@/lib/auth";
import { getAdminInformationPosts } from "@/lib/information-posts";
import { getSurveySummary } from "@/lib/service-surveys";

export async function getStaffInformationApiData() {
  const user = await requireRole(["STAFF"]);

  if (!user) {
    return {
      data: null,
      error: "Forbidden",
      status: 403,
    };
  }

  return {
    data: await getAdminInformationPosts(),
    error: null,
    status: 200,
  };
}

export async function getStaffSurveySummaryApiData() {
  const user = await requireRole(["STAFF"]);

  if (!user) {
    return {
      data: null,
      error: "Forbidden",
      status: 403,
    };
  }

  return {
    data: await getSurveySummary("staff"),
    error: null,
    status: 200,
  };
}
