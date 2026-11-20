import { requireFeatureApi } from "@/lib/feature-access";
import { handleMahasiswaImportRequest } from "@/lib/mahasiswa-import-handler";

export const runtime = "nodejs";

// Staff hanya boleh memakai fitur ini jika Admin sudah memberi akses
// "mahasiswa.import" (tab Role & Akses pada halaman admin).
export async function POST(request: Request) {
  const auth = await requireFeatureApi("mahasiswa.import");
  if (!auth.ok) return auth.response;

  return handleMahasiswaImportRequest(
    request,
    auth.user,
    "api:staff:master:mahasiswa:import",
  );
}
