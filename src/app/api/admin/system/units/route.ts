import { prisma } from "@/lib/prisma";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";

async function ensureLevelExists(levelDataId: number) {
  const level = await prisma.data_level.findUnique({
    where: { LEVEL_DATA_ID: levelDataId },
    select: { LEVEL_DATA_ID: true },
  });

  if (!level) {
    throw new AdminActionError("Level data tidak ditemukan.");
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const levelDataId = Number(body.levelDataId);
    const levelDataCode = cleanString(body.levelDataCode, 15);
    const unitName = cleanString(body.unitName, 100);

    if (!Number.isInteger(levelDataId) || levelDataId <= 0) {
      throw new AdminActionError("Level ID wajib berupa angka positif.");
    }
    if (!levelDataCode) {
      throw new AdminActionError("Kode level wajib diisi.");
    }
    if (!unitName) {
      throw new AdminActionError("Nama unit wajib diisi.");
    }

    await ensureLevelExists(levelDataId);

    const row = await prisma.data_unit.create({
      data: {
        LEVEL_DATA_ID: levelDataId,
        LEVEL_DATA_CODE: levelDataCode,
        UNIT_NAME: unitName,
        TIME_INSERT: new Date(),
        TIME_UPDATE: new Date(),
      },
      select: {
        UNIT_ID: true,
        LEVEL_DATA_ID: true,
        LEVEL_DATA_CODE: true,
        UNIT_NAME: true,
      },
    });

    return successJson(
      {
        unitId: row.UNIT_ID.toString(),
        levelDataId: row.LEVEL_DATA_ID,
        levelDataCode: row.LEVEL_DATA_CODE,
        unitName: row.UNIT_NAME,
      },
      "Unit berhasil ditambahkan.",
      201,
    );
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:units:create",
      "Unit gagal ditambahkan.",
    );
  }
}
