import {
  MAX_IMPORT_ROWS,
  MahasiswaSyncError,
  parseCsv,
  recordsFromMatrix,
  type RawRecord,
} from "@/lib/mahasiswa-sync-core";

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_COLUMNS = 30;

function cellToPrimitive(value: unknown): unknown {
  if (value === null || typeof value === "undefined") return "";

  if (typeof value === "object") {
    const cell = value as {
      richText?: { text?: string }[];
      result?: unknown;
      text?: unknown;
    };

    if (Array.isArray(cell.richText)) {
      return cell.richText.map((part) => part.text ?? "").join("");
    }
    if ("result" in cell) return cellToPrimitive(cell.result);
    if (typeof cell.text === "string") return cell.text;
    return "";
  }

  return value;
}

function hasZipSignature(buffer: Buffer) {
  return (
    buffer.length > 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

async function matrixFromXlsx(buffer: Buffer): Promise<unknown[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new MahasiswaSyncError("File Excel tidak bisa dibuka atau rusak.");
  }

  // Sama seperti sistem lama: hanya sheet pertama yang dibaca.
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new MahasiswaSyncError("File Excel tidak memiliki sheet.");
  }

  if (worksheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new MahasiswaSyncError(
      `Jumlah baris melebihi batas ${MAX_IMPORT_ROWS}.`,
      413,
    );
  }

  const columnCount = Math.min(
    Math.max(worksheet.columnCount, 6),
    MAX_IMPORT_COLUMNS,
  );
  const matrix: unknown[][] = [];

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const cells: unknown[] = [];

    for (let column = 1; column <= columnCount; column++) {
      cells.push(cellToPrimitive(row.getCell(column).value));
    }

    matrix.push(cells);
  }

  return matrix;
}

export async function parseMahasiswaImportFile(file: {
  name: string;
  size: number;
  buffer: Buffer;
}): Promise<{ records: RawRecord[]; usedLegacyOrder: boolean }> {
  const name = file.name.toLowerCase();

  if (file.size === 0) {
    throw new MahasiswaSyncError("File kosong.");
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new MahasiswaSyncError(
      `Ukuran file melebihi ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`,
      413,
    );
  }

  let matrix: unknown[][];

  if (name.endsWith(".xlsx")) {
    if (!hasZipSignature(file.buffer)) {
      throw new MahasiswaSyncError("File bukan format .xlsx yang valid.");
    }
    matrix = await matrixFromXlsx(file.buffer);
  } else if (name.endsWith(".csv")) {
    matrix = parseCsv(file.buffer.toString("utf8"));
  } else {
    throw new MahasiswaSyncError("Format file harus .xlsx atau .csv.");
  }

  return recordsFromMatrix(matrix);
}
