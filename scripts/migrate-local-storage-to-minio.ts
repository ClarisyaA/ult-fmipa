import "dotenv/config";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { assertMinioConfigured, objectExists, uploadObject } from "@/lib/minio-storage";

/**
 * One-time (but idempotent, re-runnable) migration of files that used to
 * live under the local `storage/` directory into MinIO, preserving the
 * existing folder layout as the object key prefix.
 *
 * Safe by construction:
 * - defaults to --dry-run (nothing is uploaded unless --execute is passed)
 * - never deletes local files
 * - never touches the database
 * - skips objects that already exist in MinIO unless --overwrite is passed
 * - a single bad/unreadable file is logged and skipped, not fatal
 */

const AREAS: Array<{ localDir: string; objectPrefix: string }> = [
  { localDir: path.join("storage", "home-activities"), objectPrefix: "home-activities" },
  { localDir: path.join("storage", "information"), objectPrefix: "information" },
  { localDir: path.join("storage", "uploads"), objectPrefix: "uploads" },
  { localDir: path.join("storage", "profile", "organization"), objectPrefix: "profile/organization" },
  { localDir: path.join("storage", "profile", "location"), objectPrefix: "profile/location" },
];

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const DEFAULT_CONTENT_TYPE = "application/octet-stream";

type Args = {
  execute: boolean;
  overwrite: boolean;
};

function parseArgs(argv: string[]): Args {
  return {
    execute: argv.includes("--execute"),
    overwrite: argv.includes("--overwrite"),
  };
}

function resolveContentType(fileName: string): { contentType: string; recognized: boolean } {
  const ext = path.extname(fileName).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXTENSION[ext];

  if (contentType) {
    return { contentType, recognized: true };
  }

  return { contentType: DEFAULT_CONTENT_TYPE, recognized: false };
}

async function listLocalFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name !== ".gitkeep");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

type Summary = {
  totalFound: number;
  uploaded: number;
  skippedExisting: number;
  failed: number;
  unknownExtension: number;
};

async function migrateArea(
  area: { localDir: string; objectPrefix: string },
  args: Args,
  summary: Summary
): Promise<void> {
  const absoluteDir = path.resolve(process.cwd(), area.localDir);
  const fileNames = await listLocalFiles(absoluteDir);

  if (fileNames.length === 0) {
    console.log(`[${area.objectPrefix}] no local files found in ${area.localDir}, skipping.`);
    return;
  }

  console.log(`\n[${area.objectPrefix}] found ${fileNames.length} file(s) in ${area.localDir}`);

  for (const fileName of fileNames) {
    summary.totalFound += 1;
    const objectKey = `${area.objectPrefix}/${fileName}`;
    const absoluteFilePath = path.join(absoluteDir, fileName);

    try {
      const alreadyExists = await objectExists(objectKey);

      if (alreadyExists && !args.overwrite) {
        summary.skippedExisting += 1;
        console.log(`  SKIP (already exists)  ${objectKey}`);
        continue;
      }

      const { contentType, recognized } = resolveContentType(fileName);

      if (!recognized) {
        summary.unknownExtension += 1;
        console.log(`  WARN (unknown extension, using ${contentType})  ${objectKey}`);
      }

      if (!args.execute) {
        const fileStat = await stat(absoluteFilePath);
        console.log(
          `  DRY-RUN would upload  ${objectKey}  (${fileStat.size} bytes, ${contentType})${
            alreadyExists ? " [would overwrite]" : ""
          }`
        );
        continue;
      }

      const buffer = await readFile(absoluteFilePath);
      await uploadObject(objectKey, buffer, contentType);
      summary.uploaded += 1;
      console.log(`  OK ${alreadyExists ? "(overwritten)" : "(uploaded)"}  ${objectKey}`);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAIL  ${objectKey}  -  ${message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("=== ULT-FMIPA Local Storage -> MinIO Migration ===");
  console.log(`Mode: ${args.execute ? "EXECUTE (will upload)" : "DRY-RUN (no uploads, use --execute to apply)"}`);
  console.log(`Overwrite existing objects: ${args.overwrite ? "yes" : "no (default: skip existing)"}`);

  try {
    assertMinioConfigured();
  } catch (error) {
    console.error(
      `MinIO is not configured: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
    return;
  }

  const summary: Summary = {
    totalFound: 0,
    uploaded: 0,
    skippedExisting: 0,
    failed: 0,
    unknownExtension: 0,
  };

  for (const area of AREAS) {
    await migrateArea(area, args, summary);
  }

  console.log("\n---------------------------------------------------------------");
  console.log("Summary:");
  console.log(`  Total files found     : ${summary.totalFound}`);
  console.log(`  Uploaded              : ${summary.uploaded}`);
  console.log(`  Skipped (existing)    : ${summary.skippedExisting}`);
  console.log(`  Unknown extension     : ${summary.unknownExtension}`);
  console.log(`  Failed                : ${summary.failed}`);
  console.log("\nLocal files were left untouched. No database records were modified.");

  if (args.execute && summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Migration script crashed:", error);
  process.exitCode = 1;
});
