import path from "path";
import { stat } from "fs/promises";

export type StorageArea =
  | "uploads"
  | "information"
  | "homeActivities"
  | "profileOrganization"
  | "profileLocation";

export function getStorageRoot() {
  return process.env.STORAGE_ROOT ? path.resolve(process.env.STORAGE_ROOT) : null;
}

export function getStorageDirectory(area: StorageArea) {
  const configuredRoot = getStorageRoot();

  if (configuredRoot) {
    switch (area) {
      case "uploads":
        return path.join(configuredRoot, "uploads");
      case "information":
        return path.join(configuredRoot, "information");
      case "homeActivities":
        return path.join(configuredRoot, "home-activities");
      case "profileOrganization":
        return path.join(configuredRoot, "profile", "organization");
      case "profileLocation":
        return path.join(configuredRoot, "profile", "location");
    }
  }

  switch (area) {
    case "uploads":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");
    case "information":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "information");
    case "homeActivities":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "home-activities");
    case "profileOrganization":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "profile", "organization");
    case "profileLocation":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "profile", "location");
  }
}

export function getStorageReference(area: StorageArea, storedName: string) {
  switch (area) {
    case "uploads":
      return `storage/uploads/${storedName}`;
    case "information":
      return `storage/information/${storedName}`;
    case "homeActivities":
      return `storage/home-activities/${storedName}`;
    case "profileOrganization":
      return `storage/profile/organization/${storedName}`;
    case "profileLocation":
      return `storage/profile/location/${storedName}`;
  }
}

export function getStorageAreaForProfileType(type: "organization" | "location") {
  return type === "organization" ? "profileOrganization" : "profileLocation";
}

export function resolveStoredFilePath(area: StorageArea, storedName: string | null) {
  if (!storedName || path.isAbsolute(storedName)) {
    return null;
  }

  if (
    storedName.includes("/") ||
    storedName.includes("\\") ||
    storedName !== path.basename(storedName)
  ) {
    return null;
  }

  const storageDir = getStorageDirectory(area);
  const absolutePath = path.resolve(storageDir, storedName);

  if (
    absolutePath === storageDir ||
    !absolutePath.startsWith(`${storageDir}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
}

export async function storedFileExists(area: StorageArea, storedName: string | null) {
  const absolutePath = resolveStoredFilePath(area, storedName);

  if (!absolutePath) {
    return false;
  }

  try {
    const fileStat = await stat(absolutePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}
