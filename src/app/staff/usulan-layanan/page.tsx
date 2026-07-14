import {
  ServiceSuggestionsView,
  type ServiceSuggestionViewItem,
} from "@/components/service-suggestions/service-suggestions-view";
import { getServiceSuggestions } from "@/lib/service-suggestions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toViewItem(item: Awaited<ReturnType<typeof getServiceSuggestions>>[number]) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  } satisfies ServiceSuggestionViewItem;
}

export default async function StaffServiceSuggestionsPage() {
  const suggestions = await getServiceSuggestions();

  return (
    <ServiceSuggestionsView
      title="Usulan Layanan"
      description="Tinjau usulan layanan baru dan saran peningkatan layanan dari mahasiswa atau pengunjung."
      rolePrefix="staff"
      suggestions={suggestions.map(toViewItem)}
    />
  );
}
