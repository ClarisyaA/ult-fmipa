import { SurveySummaryView } from "@/components/requests/survey-summary-view";
import { getSurveySummary } from "@/lib/service-surveys";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSurveysPage() {
  const summary = await getSurveySummary("admin");

  return (
    <SurveySummaryView
      title="Ringkasan Survei"
      description="Ringkasan kepuasan layanan dari pengajuan yang sudah selesai."
      summary={summary}
    />
  );
}
