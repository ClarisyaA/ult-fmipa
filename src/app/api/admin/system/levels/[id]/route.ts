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
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AdminActionError("ID level tidak valid.");
  }
  return id;
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
    const name = cleanString(body.levelDataName, 100);
    const fieldName = cleanString(body.fieldName, 25);

    if (!name) {
      throw new AdminActionError("Nama level wajib diisi.");
    }
    if (!fieldName) {
      throw new AdminActionError("Field name wajib diisi.");
    }

    const exists = await prisma.data_level.findUnique({
      where: { LEVEL_DATA_ID: id },
      select: { LEVEL_DATA_ID: true },
    });

    if (!exists) {
      return validationError("Data level tidak ditemukan.", 404);
    }

    const row = await prisma.data_level.update({
      where: { LEVEL_DATA_ID: id },
      data: {
        LEVEL_DATA_NAME: name,
        FIELD_NAME: fieldName,
      },
      select: {
        LEVEL_DATA_ID: true,
        LEVEL_DATA_NAME: true,
        FIELD_NAME: true,
      },
    });

    return successJson(row, "Data level berhasil diperbarui.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:levels:update",
      "Data level gagal diperbarui.",
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
    const unitCount = await prisma.data_unit.count({
      where: { LEVEL_DATA_ID: id },
    });

    if (unitCount > 0) {
      throw new AdminActionError(
        `Level masih dipakai oleh ${unitCount} unit, sehingga tidak dapat dihapus.`,
        400,
      );
    }

    await prisma.data_level.delete({ where: { LEVEL_DATA_ID: id } });

    return successJson({ id }, "Data level berhasil dihapus.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:levels:delete",
      "Data level gagal dihapus.",
    );
  }
}
