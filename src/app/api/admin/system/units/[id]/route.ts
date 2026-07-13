import { prisma } from "@/lib/prisma";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
  validationError,
} from "@/lib/admin-master-api";

function parseId(value: string) {
  try {
    const id = BigInt(value);
    if (id <= BigInt(0)) {
      throw new Error("invalid");
    }
    return id;
  } catch {
    throw new AdminActionError("ID unit tidak valid.");
  }
}

async function ensureLevelExists(levelDataId: number) {
  const level = await prisma.data_level.findUnique({
    where: { LEVEL_DATA_ID: levelDataId },
    select: { LEVEL_DATA_ID: true },
  });

  if (!level) {
    throw new AdminActionError("Level data tidak ditemukan.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);
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

    const exists = await prisma.data_unit.findUnique({
      where: { UNIT_ID: id },
      select: { UNIT_ID: true },
    });

    if (!exists) {
      return validationError("Unit tidak ditemukan.", 404);
    }

    const row = await prisma.data_unit.update({
      where: { UNIT_ID: id },
      data: {
        LEVEL_DATA_ID: levelDataId,
        LEVEL_DATA_CODE: levelDataCode,
        UNIT_NAME: unitName,
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
      "Unit berhasil diperbarui.",
    );
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:units:update",
      "Unit gagal diperbarui.",
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    const numericUnitId = Number(id);

    if (!Number.isSafeInteger(numericUnitId)) {
      throw new AdminActionError("ID unit terlalu besar untuk dicek ke user.");
    }

    const userCount = await prisma.data_users.count({
      where: { UNIT_ID: numericUnitId },
    });

    if (userCount > 0) {
      throw new AdminActionError(
        `Unit masih dipakai oleh ${userCount} user, sehingga tidak dapat dihapus.`,
      );
    }

    await prisma.data_unit.delete({ where: { UNIT_ID: id } });

    return successJson({ unitId: id.toString() }, "Unit berhasil dihapus.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:units:delete",
      "Unit gagal dihapus.",
    );
  }
}
