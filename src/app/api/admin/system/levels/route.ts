import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const id = Number(body.levelDataId);
    const name = cleanString(body.levelDataName, 100);
    const fieldName = cleanString(body.fieldName, 25);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AdminActionError("ID level wajib berupa angka positif.");
    }
    if (!name) {
      throw new AdminActionError("Nama level wajib diisi.");
    }
    if (!fieldName) {
      throw new AdminActionError("Field name wajib diisi.");
    }

    const existing = await prisma.data_level.findUnique({
      where: { LEVEL_DATA_ID: id },
      select: { LEVEL_DATA_ID: true },
    });

    if (existing) {
      throw new AdminActionError("ID level sudah digunakan.");
    }

    const row = await prisma.data_level.create({
      data: {
        LEVEL_DATA_ID: id,
        LEVEL_DATA_NAME: name,
        FIELD_NAME: fieldName,
      },
      select: {
        LEVEL_DATA_ID: true,
        LEVEL_DATA_NAME: true,
        FIELD_NAME: true,
      },
    });
    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Data Level: Membuat data level: ${row.LEVEL_DATA_ID}`,
    });

    return successJson(row, "Data level berhasil ditambahkan.", 201);
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:levels:create",
      "Data level gagal ditambahkan.",
    );
  }
}
