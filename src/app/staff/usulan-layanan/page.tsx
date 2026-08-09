import {
  ServiceSuggestionsView,
  type ServiceSuggestionViewItem,
} from "@/components/service-suggestions/service-suggestions-view";
import {
  getServiceSuggestions,
  parseServiceSuggestionSort,
} from "@/lib/service-suggestions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toViewItem(item: Awaited<ReturnType<typeof getServiceSuggestions>>[number]) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  } satisfies ServiceSuggestionViewItem;
}

type ServiceSuggestionsPageProps = {
  searchParams: Promise<{
    sort?: string;
  }>;
};

export default async function StaffServiceSuggestionsPage({
  searchParams,
}: ServiceSuggestionsPageProps) {
  const params = await searchParams;
  const sort = parseServiceSuggestionSort(params.sort);
  const suggestions = await getServiceSuggestions({ sort });

  return (
    <ServiceSuggestionsView
      key={`staff-service-suggestions-${sort}`}
      title="Usulan Layanan"
      description="Tinjau usulan layanan baru dan saran peningkatan layanan dari mahasiswa atau pengunjung."
      rolePrefix="staff"
      suggestions={suggestions.map(toViewItem)}
      sort={sort}
      exportBasePath="/api/staff/service-suggestions/export"
    />
  );
}
