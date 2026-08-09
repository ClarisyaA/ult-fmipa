import { objectExists } from "@/lib/minio-storage";

export type StorageArea =
  | "uploads"
  | "information"
  | "homeActivities"
  | "profileOrganization"
  | "profileLocation";

/**
 * MinIO object key prefix for each storage area. Mirrors the folder layout
 * that used to live under the local `storage/` directory, minus the
 * `storage/` prefix itself (that prefix is now implicit in the bucket).
 */
const AREA_PREFIXES: Record<StorageArea, string> = {
  uploads: "uploads",
  information: "information",
  homeActivities: "home-activities",
  profileOrganization: "profile/organization",
  profileLocation: "profile/location",
};

export function getStorageAreaPrefix(area: StorageArea): string {
  return AREA_PREFIXES[area];
}

export function getStorageAreaForProfileType(
  type: "organization" | "location"
): StorageArea {
  return type === "organization" ? "profileOrganization" : "profileLocation";
}

/**
 * Builds the object key that gets persisted in the database for a freshly
 * stored file, e.g. `information/<uuid>.webp`. Always uses `/` regardless
 * of OS, since this is an object key, not a filesystem path.
 */
export function getStorageReference(area: StorageArea, storedName: string): string {
  return `${getStorageAreaPrefix(area)}/${storedName}`;
}

/**
 * Extracts a bare stored-file name (basename) out of any legacy or current
 * reference string, tolerating the shapes that existed before this
 * migration: a leading slash, a `storage/` prefix, Windows backslashes, or
 * a full legacy absolute path. Only the final path segment is ever trusted;
 * everything before it is discarded rather than interpreted.
 *
 * Returns null for empty/unsafe input (null bytes, `.`/`..` as the final
 * segment).
 */
export function extractStoredName(reference: string | null | undefined): string | null {
  if (!reference) {
    return null;
  }

  if (reference.includes("\0")) {
    return null;
  }

  const normalized = reference.replace(/\\/g, "/");
  const segments = normalized.split("/").filter((segment) => segment.length > 0);
  const last = segments[segments.length - 1];

  if (!last || last === "." || last === "..") {
    return null;
  }

  return last;
}

/**
 * Validates a stored file name and resolves it to a safe object key inside
 * the given storage area. Rejects anything that isn't a bare file name:
 * empty values, null bytes, `..` traversal, absolute POSIX/Windows paths,
 * drive letters, or any embedded path separator.
 */
export function resolveObjectKey(
  area: StorageArea,
  storedName: string | null | undefined
): string | null {
  if (!storedName) {
    return null;
  }

  if (storedName.includes("\0")) {
    return null;
  }

  if (storedName.startsWith("/") || storedName.startsWith("\\")) {
    return null;
  }

  if (/^[a-zA-Z]:/.test(storedName)) {
    return null;
  }

  const normalized = storedName.replace(/\\/g, "/");
  const segments = normalized.split("/");

  if (segments.length !== 1) {
    return null;
  }

  const name = segments[0];

  if (!name || name === "." || name === "..") {
    return null;
  }

  return getStorageReference(area, name);
}

/**
 * Normalizes a possibly-legacy database reference (old local filesystem
 * path, old relative reference, or current object key) down to a safe
 * object key inside the given area. Use this whenever reading a
 * `STORAGE_PATH`/`IMAGE_PATH`-style column that may predate the MinIO
 * migration.
 */
export function normalizeStorageReference(
  area: StorageArea,
  reference: string | null | undefined
): string | null {
  return resolveObjectKey(area, extractStoredName(reference));
}

export async function storedFileExists(
  area: StorageArea,
  storedName: string | null | undefined
): Promise<boolean> {
  const objectKey = resolveObjectKey(area, storedName ?? undefined);

  if (!objectKey) {
    return false;
  }

  try {
    return await objectExists(objectKey);
  } catch {
    return false;
  }
}
