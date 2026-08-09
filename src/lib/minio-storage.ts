import { Client } from "minio";
import type { Readable } from "stream";

/**
 * Server-only MinIO object storage client. Never import this from a
 * Client Component or anything that could end up in a browser bundle.
 */

export class MinioConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MinioConfigError";
  }
}

export class MinioStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "MinioStorageError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

type MinioConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
};

function readConfig(): MinioConfig {
  const endPoint = process.env.MINIO_ENDPOINT?.trim();
  const portRaw = process.env.MINIO_PORT?.trim();
  const useSSLRaw = process.env.MINIO_USE_SSL?.trim();
  const accessKey = process.env.MINIO_ACCESS_KEY?.trim();
  const secretKey = process.env.MINIO_SECRET_KEY?.trim();
  const bucket = process.env.MINIO_BUCKET?.trim();

  const missing: string[] = [];
  if (!endPoint) missing.push("MINIO_ENDPOINT");
  if (!portRaw) missing.push("MINIO_PORT");
  if (!accessKey) missing.push("MINIO_ACCESS_KEY");
  if (!secretKey) missing.push("MINIO_SECRET_KEY");
  if (!bucket) missing.push("MINIO_BUCKET");

  if (missing.length > 0) {
    throw new MinioConfigError(
      `Konfigurasi MinIO tidak lengkap. Variabel lingkungan berikut wajib diisi: ${missing.join(", ")}.`
    );
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new MinioConfigError("MINIO_PORT harus berupa angka port yang valid (1-65535).");
  }

  if (useSSLRaw !== undefined && useSSLRaw !== "" && useSSLRaw !== "true" && useSSLRaw !== "false") {
    throw new MinioConfigError('MINIO_USE_SSL hanya boleh bernilai "true" atau "false".');
  }

  return {
    endPoint: endPoint as string,
    port,
    useSSL: useSSLRaw === "true",
    accessKey: accessKey as string,
    secretKey: secretKey as string,
    bucket: bucket as string,
  };
}

/** Throws MinioConfigError with a clear (secret-free) message if config is invalid/incomplete. */
export function assertMinioConfigured(): void {
  readConfig();
}

let cachedClient: Client | null = null;
let cachedBucket: string | null = null;

function getConfiguredClient(): { client: Client; bucket: string } {
  if (cachedClient && cachedBucket) {
    return { client: cachedClient, bucket: cachedBucket };
  }

  const config = readConfig();

  cachedClient = new Client({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });
  cachedBucket = config.bucket;

  return { client: cachedClient, bucket: cachedBucket };
}

export type ObjectMetadata = {
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
};

export function isObjectNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code;
  return code === "NotFound" || code === "NoSuchKey";
}

export async function uploadObject(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { client, bucket } = getConfiguredClient();

  try {
    await client.putObject(bucket, key, buffer, buffer.length, {
      "Content-Type": contentType,
    });
  } catch (error) {
    throw new MinioStorageError("Gagal mengunggah file ke object storage.", {
      cause: error,
    });
  }
}

export async function getObjectStream(key: string): Promise<Readable> {
  const { client, bucket } = getConfiguredClient();

  try {
    return await client.getObject(bucket, key);
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      throw error;
    }

    throw new MinioStorageError("Gagal mengambil file dari object storage.", {
      cause: error,
    });
  }
}

/**
 * Buffers an entire object in memory. Only use this for small, bounded
 * payloads (e.g. server-side re-processing) — prefer getObjectStream for
 * anything served back to a client.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const stream = await getObjectStream(key);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function statObject(key: string): Promise<ObjectMetadata> {
  const { client, bucket } = getConfiguredClient();

  try {
    const stat = await client.statObject(bucket, key);

    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      contentType: stat.metaData?.["content-type"],
    };
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      throw error;
    }

    throw new MinioStorageError("Gagal membaca metadata file dari object storage.", {
      cause: error,
    });
  }
}

export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = getConfiguredClient();

  try {
    await client.removeObject(bucket, key);
  } catch (error) {
    throw new MinioStorageError("Gagal menghapus file dari object storage.", {
      cause: error,
    });
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await statObject(key);
    return true;
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}
