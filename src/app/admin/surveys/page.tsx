import { SurveySummaryView } from "@/components/requests/survey-summary-view";
import {
  getSurveyServiceOptions,
  getSurveySummary,
} from "@/lib/service-surveys";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminSurveysPageProps = {
  searchParams: Promise<{
    q?: string;
    service?: string;
    page?: string;
  }>;
};

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function AdminSurveysPage({
  searchParams,
}: AdminSurveysPageProps) {
  const params = await searchParams;
  const serviceOptions = getSurveyServiceOptions();
  const summary = await getSurveySummary("admin", {
    search: params.q,
    serviceSlug: params.service,
    page: parsePage(params.page),
    pageSize: 10,
  });

  return (
    <SurveySummaryView
      title="Ringkasan Survei"
      description="Ringkasan kepuasan layanan dari pengajuan yang sudah selesai."
      summary={summary}
      serviceOptions={serviceOptions}
      search={params.q ?? ""}
      selectedServiceSlug={params.service ?? ""}
      exportBasePath="/api/admin/surveys/export"
    />
  );
}
