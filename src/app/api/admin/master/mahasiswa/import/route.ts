import { requireAdminApi } from "@/lib/admin-master-api";
import { handleMahasiswaImportRequest } from "@/lib/mahasiswa-import-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  return handleMahasiswaImportRequest(
    request,
    auth.user,
    "api:admin:master:mahasiswa:import",
  );
}
