import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Client as MinioClient } from "minio";

const bucket = process.env.MINIO_BUCKET ?? "ult-fmipa";
const uploadsPrefix = "uploads/";

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 13306),
    user: process.env.DB_USER ?? "ult_user",
    password: process.env.DB_PASSWORD ?? "ult_password",
    database: process.env.DB_NAME ?? "fmipa_sbpk",
    connectionLimit: 5,
  });

  return new PrismaClient({ adapter });
}

function createMinioClient() {
  const endPoint = process.env.MINIO_ENDPOINT;
  const port = Number(process.env.MINIO_PORT ?? 9000);
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endPoint || !accessKey || !secretKey) {
    throw new Error(
      "Konfigurasi MinIO tidak lengkap. Pastikan MINIO_ENDPOINT, MINIO_ACCESS_KEY, dan MINIO_SECRET_KEY diset."
    );
  }

  return new MinioClient({
    endPoint,
    port,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey,
    secretKey,
  });
}

async function listObjectsUnderPrefix(minio, prefix) {
  const objects = new Map();

  await new Promise((resolve, reject) => {
    const stream = minio.listObjectsV2(bucket, prefix, false);

    stream.on("data", (obj) => {
      const name = obj.name.slice(prefix.length);
      if (name) {
        objects.set(name, { name, sizeBytes: obj.size });
      }
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  return objects;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function auditStorageIntegrity() {
  console.log("=== ULT-FMIPA Storage Integrity Audit (Dry-Run / Read-Only) ===");
  console.log(`Target Bucket        : ${bucket}`);
  console.log(`Target Object Prefix : ${uploadsPrefix}`);
  console.log("---------------------------------------------------------------");

  const prisma = createPrismaClient();
  let minio;

  try {
    minio = createMinioClient();
  } catch (error) {
    console.error("Storage integrity audit error:", error.message ?? error);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  try {
    const dbAttachments = await prisma.ult_request_attachments.findMany();
    const objects = await listObjectsUnderPrefix(minio, uploadsPrefix);

    const dbAttachmentCount = dbAttachments.length;
    const objectCount = objects.size;

    let totalObjectSizeBytes = 0;
    for (const object of objects.values()) {
      totalObjectSizeBytes += object.sizeBytes;
    }

    const missingObjects = [];
    const sizeMismatches = [];
    const invalidPaths = [];
    const matchedObjectNames = new Set();

    for (const record of dbAttachments) {
      const storedName = record.STORED_NAME;

      if (!storedName || storedName.includes("..") || storedName.includes("/") || storedName.includes("\\")) {
        invalidPaths.push({
          id: String(record.ID),
          storedName,
          issue: "INVALID_STORED_NAME",
        });
        continue;
      }

      const object = objects.get(storedName);

      if (!object) {
        missingObjects.push({
          id: String(record.ID),
          storedName,
          expectedSize: record.SIZE_BYTES,
          issue: "MISSING_OBJECT",
        });
      } else {
        matchedObjectNames.add(storedName);
        if (record.SIZE_BYTES > 0 && object.sizeBytes !== record.SIZE_BYTES) {
          sizeMismatches.push({
            id: String(record.ID),
            storedName,
            dbSizeBytes: record.SIZE_BYTES,
            objectSizeBytes: object.sizeBytes,
            issue: "SIZE_MISMATCH",
          });
        }
      }
    }

    const orphanObjects = [];
    for (const [name, object] of objects.entries()) {
      if (!matchedObjectNames.has(name)) {
        orphanObjects.push({
          storedName: name,
          objectSizeBytes: object.sizeBytes,
          issue: "ORPHAN_OBJECT",
        });
      }
    }

    console.log(`\nAudit Metrics Summary:`);
    console.log(`- Total DB Attachment Records: ${dbAttachmentCount}`);
    console.log(`- Total MinIO Objects        : ${objectCount}`);
    console.log(`- Total Object Storage Size  : ${formatBytes(totalObjectSizeBytes)} (${totalObjectSizeBytes} bytes)`);

    console.log(`\nDiscrepancy Breakdown:`);
    console.log(`- Missing MinIO Objects      : ${missingObjects.length}`);
    console.log(`- Orphan MinIO Objects       : ${orphanObjects.length}`);
    console.log(`- Object Size Mismatches     : ${sizeMismatches.length}`);
    console.log(`- Invalid Metadata Paths     : ${invalidPaths.length}`);

    if (missingObjects.length > 0) {
      console.log("\n[!] Missing MinIO Objects (DB record exists, object missing):");
      missingObjects.forEach((item) => {
        console.log(`  - Attachment ID: ${item.id} | StoredName: ${item.storedName} | Expected: ${item.expectedSize} bytes`);
      });
    }

    if (orphanObjects.length > 0) {
      console.log("\n[!] Orphan MinIO Objects (object exists, no DB record):");
      orphanObjects.forEach((item) => {
        console.log(`  - StoredName: ${item.storedName} | Size: ${item.objectSizeBytes} bytes`);
      });
    }

    if (sizeMismatches.length > 0) {
      console.log("\n[!] Object Size Mismatches:");
      sizeMismatches.forEach((item) => {
        console.log(`  - Attachment ID: ${item.id} | DB Size: ${item.dbSizeBytes} B | Object Size: ${item.objectSizeBytes} B`);
      });
    }

    if (invalidPaths.length > 0) {
      console.log("\n[!] Invalid Metadata Paths:");
      invalidPaths.forEach((item) => {
        console.log(`  - Attachment ID: ${item.id} | Path: ${item.storedName}`);
      });
    }

    const isStrict = process.argv.includes("--strict");

    const totalDiscrepancies =
      missingObjects.length + orphanObjects.length + sizeMismatches.length + invalidPaths.length;

    console.log("\n---------------------------------------------------------------");
    console.log(`Script Execution Status : Succeeded (Script completed safely)`);

    if (totalDiscrepancies === 0) {
      console.log(`Integrity Status        : CLEAN (No discrepancies found)`);
      console.log("\n[OK] Storage integrity verification PASSED! All metadata matches MinIO object storage.");
    } else {
      console.log(`Integrity Status        : DISCREPANCIES FOUND (${totalDiscrepancies} total issue(s))`);
      console.log("\n[!] Storage integrity audit detected data discrepancies listed above.");

      if (isStrict) {
        console.log("[STRICT MODE] Exiting with code 1 due to detected storage integrity discrepancies.");
        process.exitCode = 1;
      } else {
        console.log("[DRY-RUN MODE] Exiting with code 0. Use '--strict' flag to force non-zero exit code on discrepancies.");
      }
    }
  } catch (error) {
    console.error("Storage integrity audit error:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

auditStorageIntegrity();
