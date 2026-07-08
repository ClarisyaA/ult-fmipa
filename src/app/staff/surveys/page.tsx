import { SurveySummaryView } from "@/components/requests/survey-summary-view";
import type { SurveySummary } from "@/lib/service-surveys";
import { getStaffSurveySummaryApiData } from "@/lib/staff-api-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function StaffSurveysPage() {
  const { data, error } = await getStaffSurveySummaryApiData();
  const summary = data ?? emptySummary;

  return (
    <SurveySummaryView
      title="Ringkasan Survei"
      description={
        error ??
        "Ringkasan kepuasan layanan dari pengajuan yang sudah selesai."
      }
      summary={summary}
    />
  );
}
