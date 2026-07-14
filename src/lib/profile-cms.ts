import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";
import {
  deleteProfileImageFile,
  type SavedProfileImageMetadata,
} from "@/lib/profile-image-upload";

export type ProfileImageFit = "cover" | "contain";
export type ProfileColorVariant = "emerald" | "red" | "amber";

export type ProfileOrganizationNode = {
  id: string;
  parentId: string | null;
  name: string;
  positionTitle: string;
  roleLabel: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  photoOriginalName: string | null;
  photoStoredName: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  colorVariant: ProfileColorVariant;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  children: ProfileOrganizationNode[];
};

export type ProfileLocationHour = {
  id: string;
  locationId: string;
  dayLabel: string;
  timeLabel: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type ProfileLocationSettings = {
  id: string;
  eyebrow: string | null;
  title: string;
  description: string;
  directionLabel: string;
  directionUrl: string | null;
  email: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageFit: ProfileImageFit;
  imageOriginalName: string | null;
  imageStoredName: string | null;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  isActive: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  hours: ProfileLocationHour[];
};

export type ProfileOrganizationInput = {
  parentId?: string | null;
  name: string;
  positionTitle: string;
  roleLabel?: string | null;
  photoAlt?: string | null;
  colorVariant?: string | null;
  isActive?: boolean | string | null;
  sortOrder?: number | string | null;
  actor?: string | null;
};

export type ProfileLocationInput = {
  eyebrow?: string | null;
  title: string;
  description: string;
  directionLabel: string;
  directionUrl?: string | null;
  email?: string | null;
  imageAlt?: string | null;
  imageFit?: string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

export type ProfileLocationHourInput = {
  dayLabel: string;
  timeLabel: string;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
};

type OrganizationRecord = {
  ID: bigint | number | string;
  PARENT_ID: bigint | number | string | null;
  NAME: string;
  POSITION_TITLE: string;
  ROLE_LABEL: string | null;
  PHOTO_PATH: string | null;
  PHOTO_ORIGINAL_NAME: string | null;
  PHOTO_STORED_NAME: string | null;
  PHOTO_MIME_TYPE: string | null;
  PHOTO_SIZE_BYTES: number | null;
  PHOTO_ALT: string | null;
  COLOR_VARIANT: string | null;
  IS_ACTIVE: boolean | number;
  SORT_ORDER: number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

type LocationRecord = {
  ID: bigint | number | string;
  EYEBROW: string | null;
  TITLE: string;
  DESCRIPTION: string;
  DIRECTION_LABEL: string;
  DIRECTION_URL: string | null;
  EMAIL: string | null;
  IMAGE_PATH: string | null;
  IMAGE_ORIGINAL_NAME: string | null;
  IMAGE_STORED_NAME: string | null;
  IMAGE_MIME_TYPE: string | null;
  IMAGE_SIZE_BYTES: number | null;
  IMAGE_ALT: string | null;
  IMAGE_FIT: string | null;
  IS_ACTIVE: boolean | number;
  UPDATED_AT: Date | string | null;
  UPDATED_BY: string | null;
};

type HourRecord = {
  ID: bigint | number | string;
  LOCATION_ID: bigint | number | string;
  DAY_LABEL: string;
  TIME_LABEL: string;
  SORT_ORDER: number;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
};

export class ProfileValidationError extends Error {
  statusCode = 400;
}

export class ProfileConflictError extends Error {
  statusCode = 409;
}

export class ProfileTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super("Tabel CMS profil belum tersedia. Jalankan migration 012_create_profile_cms_tables.sql.");
    this.name = "ProfileTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new ProfileValidationError("ID tidak valid.");
  }
}

function optionalText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, max) : null;
}

function requiredText(value: string | null | undefined, message: string, max: number) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileValidationError(message);
  }

  return trimmed.slice(0, max);
}

function normalizeBoolean(value: boolean | string | null | undefined, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1" || value === "on";
  return fallback;
}

function normalizeSortOrder(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return 0;
  }

  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    throw new ProfileValidationError("Urutan harus berupa angka.");
  }

  return Math.trunc(numeric);
}

export function normalizeProfileImageFit(value: string | null | undefined): ProfileImageFit {
  if (!value) return "cover";
  if (value === "cover" || value === "contain") return value;
  throw new ProfileValidationError("Tampilan gambar tidak valid.");
}

function normalizeColorVariant(value: string | null | undefined): ProfileColorVariant {
  if (value === "red" || value === "amber" || value === "emerald") {
    return value;
  }

  return "emerald";
}

function normalizeParentId(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || trimmed === "root" || trimmed === "none") {
    return null;
  }

  assertValidId(trimmed);
  return trimmed;
}

function normalizeOrganizationInput(input: ProfileOrganizationInput) {
  return {
    parentId: normalizeParentId(input.parentId),
    name: requiredText(input.name, "Nama orang wajib diisi.", 150),
    positionTitle: requiredText(input.positionTitle, "Jabatan wajib diisi.", 150),
    roleLabel: optionalText(input.roleLabel, 100),
    photoAlt: optionalText(input.photoAlt, 150),
    colorVariant: normalizeColorVariant(input.colorVariant),
    isActive: normalizeBoolean(input.isActive, true),
    sortOrder: normalizeSortOrder(input.sortOrder),
    actor: optionalText(input.actor, 100),
  };
}

function normalizeLocationInput(input: ProfileLocationInput) {
  const directionUrl = optionalText(input.directionUrl, 500);
  const email = optionalText(input.email, 150);

  if (directionUrl) {
    try {
      new URL(directionUrl);
    } catch {
      throw new ProfileValidationError("URL petunjuk arah harus berupa URL absolut.");
    }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ProfileValidationError("Email tidak valid.");
  }

  return {
    eyebrow: optionalText(input.eyebrow, 100),
    title: requiredText(input.title, "Judul lokasi wajib diisi.", 150),
    description: requiredText(input.description, "Deskripsi lokasi wajib diisi.", 5000),
    directionLabel: requiredText(input.directionLabel, "Label tombol arah wajib diisi.", 80),
    directionUrl,
    email,
    imageAlt: optionalText(input.imageAlt, 150),
    imageFit: normalizeProfileImageFit(input.imageFit),
    isActive: normalizeBoolean(input.isActive, true),
    actor: optionalText(input.actor, 100),
  };
}

function normalizeHourInput(input: ProfileLocationHourInput) {
  return {
    dayLabel: requiredText(input.dayLabel, "Label hari wajib diisi.", 100),
    timeLabel: requiredText(input.timeLabel, "Label jam wajib diisi.", 100),
    sortOrder: normalizeSortOrder(input.sortOrder),
    isActive: normalizeBoolean(input.isActive, true),
  };
}

function isMissingProfileTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    /ult_profile_(organization_nodes|location_settings|location_hours)/.test(message) &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnProfileReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) console.warn(message, error);
    else console.warn(message);
  }
}

function handleReadError(error: unknown) {
  if (isMissingProfileTableError(error)) {
    warnProfileReadError("Tabel CMS profil belum tersedia. Jalankan migration 012_create_profile_cms_tables.sql.");
    return;
  }

  if (isDatabaseUnavailableError(error)) {
    warnProfileReadError("Database CMS profil sementara tidak tersedia.", error);
    return;
  }

  throw error;
}

async function hasProfileTables() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (
          'ult_profile_organization_nodes',
          'ult_profile_location_settings',
          'ult_profile_location_hours'
        )
    `;

    return Number(rows[0]?.tableCount ?? 0) === 3;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnProfileReadError("Database CMS profil sementara tidak tersedia.", error);
      return false;
    }

    throw error;
  }
}

export async function ensureProfileTablesAvailable() {
  if (!(await hasProfileTables())) {
    throw new ProfileTableUnavailableError();
  }
}

function toOrganizationNode(record: OrganizationRecord): ProfileOrganizationNode {
  const id = String(record.ID);

  return {
    id,
    parentId: record.PARENT_ID === null ? null : String(record.PARENT_ID),
    name: record.NAME,
    positionTitle: record.POSITION_TITLE,
    roleLabel: record.ROLE_LABEL,
    photoPath: record.PHOTO_PATH,
    photoUrl: record.PHOTO_PATH ? `/api/profile/images/organization/${id}` : null,
    photoAlt: record.PHOTO_ALT,
    photoOriginalName: record.PHOTO_ORIGINAL_NAME,
    photoStoredName: record.PHOTO_STORED_NAME,
    photoMimeType: record.PHOTO_MIME_TYPE,
    photoSizeBytes: record.PHOTO_SIZE_BYTES,
    colorVariant: normalizeColorVariant(record.COLOR_VARIANT),
    isActive: Boolean(record.IS_ACTIVE),
    sortOrder: Number(record.SORT_ORDER),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
    children: [],
  };
}

function buildOrganizationTree(nodes: ProfileOrganizationNode[]) {
  const byId = new Map<string, ProfileOrganizationNode>();
  const roots: ProfileOrganizationNode[] = [];

  nodes.forEach((node) => {
    byId.set(node.id, { ...node, children: [] });
  });

  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (items: ProfileOrganizationNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(roots);
  return roots;
}

async function getOrganizationRecords(activeOnly: boolean) {
  if (!(await hasProfileTables())) {
    return [];
  }

  try {
    if (activeOnly) {
      return await prisma.$queryRaw<OrganizationRecord[]>`
        SELECT * FROM ult_profile_organization_nodes
        WHERE IS_ACTIVE = 1
        ORDER BY SORT_ORDER ASC, ID ASC
      `;
    }

    return await prisma.$queryRaw<OrganizationRecord[]>`
      SELECT * FROM ult_profile_organization_nodes
      ORDER BY SORT_ORDER ASC, ID ASC
    `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

export async function getPublicProfileOrganizationTree() {
  const rows = await getOrganizationRecords(true);
  return buildOrganizationTree(rows.map(toOrganizationNode));
}

export async function getAdminProfileOrganizationNodes() {
  const rows = await getOrganizationRecords(false);
  return rows.map(toOrganizationNode);
}

export async function getAdminProfileOrganizationState() {
  const tableAvailable = await hasProfileTables();

  if (!tableAvailable) {
    return { nodes: [], tree: [], unavailable: true };
  }

  const nodes = await getAdminProfileOrganizationNodes();
  return { nodes, tree: buildOrganizationTree(nodes), unavailable: false };
}

export async function getProfileOrganizationNodeById(id: string) {
  assertValidId(id);

  if (!(await hasProfileTables())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<OrganizationRecord[]>`
      SELECT * FROM ult_profile_organization_nodes
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;

    return rows[0] ? toOrganizationNode(rows[0]) : null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

async function assertParentIsValid(parentId: string | null, selfId?: string) {
  if (!parentId) return;
  if (selfId && parentId === selfId) {
    throw new ProfileConflictError("Node tidak bisa memilih dirinya sendiri sebagai atasan.");
  }

  const parent = await getProfileOrganizationNodeById(parentId);
  if (!parent) {
    throw new ProfileValidationError("Atasan tidak ditemukan.");
  }

  if (!selfId) return;

  let currentParentId = parent.parentId;
  while (currentParentId) {
    if (currentParentId === selfId) {
      throw new ProfileConflictError("Relasi atasan akan membuat struktur melingkar.");
    }

    const currentParent = await getProfileOrganizationNodeById(currentParentId);
    currentParentId = currentParent?.parentId ?? null;
  }
}

export async function createProfileOrganizationNode(
  input: ProfileOrganizationInput,
  image?: SavedProfileImageMetadata | null
) {
  await ensureProfileTablesAvailable();
  const data = normalizeOrganizationInput(input);
  await assertParentIsValid(data.parentId);

  await prisma.$executeRaw`
    INSERT INTO ult_profile_organization_nodes (
      PARENT_ID,
      NAME,
      POSITION_TITLE,
      ROLE_LABEL,
      PHOTO_PATH,
      PHOTO_ORIGINAL_NAME,
      PHOTO_STORED_NAME,
      PHOTO_MIME_TYPE,
      PHOTO_SIZE_BYTES,
      PHOTO_ALT,
      COLOR_VARIANT,
      IS_ACTIVE,
      SORT_ORDER,
      CREATED_BY
    ) VALUES (
      ${data.parentId ? BigInt(data.parentId) : null},
      ${data.name},
      ${data.positionTitle},
      ${data.roleLabel},
      ${image?.storagePath ?? null},
      ${image?.originalName ?? null},
      ${image?.storedName ?? null},
      ${image?.mimeType ?? null},
      ${image?.sizeBytes ?? null},
      ${data.photoAlt},
      ${data.colorVariant},
      ${data.isActive ? 1 : 0},
      ${data.sortOrder},
      ${data.actor}
    )
  `;

  const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
    SELECT ID FROM ult_profile_organization_nodes ORDER BY ID DESC LIMIT 1
  `;

  return rows[0] ? getProfileOrganizationNodeById(String(rows[0].ID)) : null;
}

export async function updateProfileOrganizationNode(
  id: string,
  input: ProfileOrganizationInput,
  image?: SavedProfileImageMetadata | null
) {
  assertValidId(id);
  await ensureProfileTablesAvailable();
  const existing = await getProfileOrganizationNodeById(id);

  if (!existing) {
    return null;
  }

  const data = normalizeOrganizationInput(input);
  await assertParentIsValid(data.parentId, id);

  if (image) {
    await prisma.$executeRaw`
      UPDATE ult_profile_organization_nodes
      SET
        PARENT_ID = ${data.parentId ? BigInt(data.parentId) : null},
        NAME = ${data.name},
        POSITION_TITLE = ${data.positionTitle},
        ROLE_LABEL = ${data.roleLabel},
        PHOTO_PATH = ${image.storagePath},
        PHOTO_ORIGINAL_NAME = ${image.originalName},
        PHOTO_STORED_NAME = ${image.storedName},
        PHOTO_MIME_TYPE = ${image.mimeType},
        PHOTO_SIZE_BYTES = ${image.sizeBytes},
        PHOTO_ALT = ${data.photoAlt},
        COLOR_VARIANT = ${data.colorVariant},
        IS_ACTIVE = ${data.isActive ? 1 : 0},
        SORT_ORDER = ${data.sortOrder},
        UPDATED_BY = ${data.actor},
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;
    await deleteProfileImageFile(existing.photoPath, "organization");
  } else {
    await prisma.$executeRaw`
      UPDATE ult_profile_organization_nodes
      SET
        PARENT_ID = ${data.parentId ? BigInt(data.parentId) : null},
        NAME = ${data.name},
        POSITION_TITLE = ${data.positionTitle},
        ROLE_LABEL = ${data.roleLabel},
        PHOTO_ALT = ${data.photoAlt},
        COLOR_VARIANT = ${data.colorVariant},
        IS_ACTIVE = ${data.isActive ? 1 : 0},
        SORT_ORDER = ${data.sortOrder},
        UPDATED_BY = ${data.actor},
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;
  }

  return getProfileOrganizationNodeById(id);
}

export async function deleteProfileOrganizationNode(id: string) {
  assertValidId(id);
  await ensureProfileTablesAvailable();
  const existing = await getProfileOrganizationNodeById(id);

  if (!existing) {
    return false;
  }

  const children = await prisma.$queryRaw<Array<{ childCount: bigint | number }>>`
    SELECT COUNT(*) AS childCount
    FROM ult_profile_organization_nodes
    WHERE PARENT_ID = ${BigInt(id)}
  `;

  if (Number(children[0]?.childCount ?? 0) > 0) {
    throw new ProfileConflictError("Node masih memiliki bawahan. Pindahkan atau hapus bawahan terlebih dahulu.");
  }

  await prisma.$executeRaw`
    DELETE FROM ult_profile_organization_nodes
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;
  await deleteProfileImageFile(existing.photoPath, "organization");
  return true;
}

function toHour(record: HourRecord): ProfileLocationHour {
  return {
    id: String(record.ID),
    locationId: String(record.LOCATION_ID),
    dayLabel: record.DAY_LABEL,
    timeLabel: record.TIME_LABEL,
    sortOrder: Number(record.SORT_ORDER),
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
  };
}

function toLocation(record: LocationRecord, hours: ProfileLocationHour[]): ProfileLocationSettings {
  const id = String(record.ID);

  return {
    id,
    eyebrow: record.EYEBROW,
    title: record.TITLE,
    description: record.DESCRIPTION,
    directionLabel: record.DIRECTION_LABEL,
    directionUrl: record.DIRECTION_URL,
    email: record.EMAIL,
    imagePath: record.IMAGE_PATH,
    imageUrl: record.IMAGE_PATH ? `/api/profile/images/location/${id}` : null,
    imageAlt: record.IMAGE_ALT,
    imageFit: normalizeProfileImageFit(record.IMAGE_FIT),
    imageOriginalName: record.IMAGE_ORIGINAL_NAME,
    imageStoredName: record.IMAGE_STORED_NAME,
    imageMimeType: record.IMAGE_MIME_TYPE,
    imageSizeBytes: record.IMAGE_SIZE_BYTES,
    isActive: Boolean(record.IS_ACTIVE),
    updatedAt: toIso(record.UPDATED_AT),
    updatedBy: record.UPDATED_BY,
    hours,
  };
}

async function getLocationHours(locationId: string, activeOnly: boolean) {
  if (activeOnly) {
    const rows = await prisma.$queryRaw<HourRecord[]>`
      SELECT * FROM ult_profile_location_hours
      WHERE LOCATION_ID = ${BigInt(locationId)} AND IS_ACTIVE = 1
      ORDER BY SORT_ORDER ASC, ID ASC
    `;
    return rows.map(toHour);
  }

  const rows = await prisma.$queryRaw<HourRecord[]>`
    SELECT * FROM ult_profile_location_hours
    WHERE LOCATION_ID = ${BigInt(locationId)}
    ORDER BY SORT_ORDER ASC, ID ASC
  `;
  return rows.map(toHour);
}

export async function getProfileLocationSettings(activeOnly = false) {
  if (!(await hasProfileTables())) {
    return null;
  }

  try {
    const rows = activeOnly
      ? await prisma.$queryRaw<LocationRecord[]>`
          SELECT * FROM ult_profile_location_settings
          WHERE IS_ACTIVE = 1
          ORDER BY ID ASC
          LIMIT 1
        `
      : await prisma.$queryRaw<LocationRecord[]>`
          SELECT * FROM ult_profile_location_settings
          ORDER BY ID ASC
          LIMIT 1
        `;

    if (!rows[0]) {
      return null;
    }

    const hours = await getLocationHours(String(rows[0].ID), activeOnly);
    return toLocation(rows[0], hours);
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function getProfileLocationState() {
  const tableAvailable = await hasProfileTables();

  if (!tableAvailable) {
    return { location: null, unavailable: true };
  }

  return { location: await getProfileLocationSettings(false), unavailable: false };
}

export async function updateProfileLocationSettings(
  input: ProfileLocationInput,
  image?: SavedProfileImageMetadata | null
) {
  await ensureProfileTablesAvailable();
  const existing = await getProfileLocationSettings(false);
  const data = normalizeLocationInput(input);

  if (!existing) {
    await prisma.$executeRaw`
      INSERT INTO ult_profile_location_settings (
        EYEBROW,
        TITLE,
        DESCRIPTION,
        DIRECTION_LABEL,
        DIRECTION_URL,
        EMAIL,
        IMAGE_PATH,
        IMAGE_ORIGINAL_NAME,
        IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE,
        IMAGE_SIZE_BYTES,
        IMAGE_ALT,
        IMAGE_FIT,
        IS_ACTIVE,
        UPDATED_BY
      ) VALUES (
        ${data.eyebrow},
        ${data.title},
        ${data.description},
        ${data.directionLabel},
        ${data.directionUrl},
        ${data.email},
        ${image?.storagePath ?? null},
        ${image?.originalName ?? null},
        ${image?.storedName ?? null},
        ${image?.mimeType ?? null},
        ${image?.sizeBytes ?? null},
        ${data.imageAlt},
        ${data.imageFit},
        ${data.isActive ? 1 : 0},
        ${data.actor}
      )
    `;
  } else if (image) {
    await prisma.$executeRaw`
      UPDATE ult_profile_location_settings
      SET
        EYEBROW = ${data.eyebrow},
        TITLE = ${data.title},
        DESCRIPTION = ${data.description},
        DIRECTION_LABEL = ${data.directionLabel},
        DIRECTION_URL = ${data.directionUrl},
        EMAIL = ${data.email},
        IMAGE_PATH = ${image.storagePath},
        IMAGE_ORIGINAL_NAME = ${image.originalName},
        IMAGE_STORED_NAME = ${image.storedName},
        IMAGE_MIME_TYPE = ${image.mimeType},
        IMAGE_SIZE_BYTES = ${image.sizeBytes},
        IMAGE_ALT = ${data.imageAlt},
        IMAGE_FIT = ${data.imageFit},
        IS_ACTIVE = ${data.isActive ? 1 : 0},
        UPDATED_BY = ${data.actor},
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(existing.id)}
      LIMIT 1
    `;
    await deleteProfileImageFile(existing.imagePath, "location");
  } else {
    await prisma.$executeRaw`
      UPDATE ult_profile_location_settings
      SET
        EYEBROW = ${data.eyebrow},
        TITLE = ${data.title},
        DESCRIPTION = ${data.description},
        DIRECTION_LABEL = ${data.directionLabel},
        DIRECTION_URL = ${data.directionUrl},
        EMAIL = ${data.email},
        IMAGE_ALT = ${data.imageAlt},
        IMAGE_FIT = ${data.imageFit},
        IS_ACTIVE = ${data.isActive ? 1 : 0},
        UPDATED_BY = ${data.actor},
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(existing.id)}
      LIMIT 1
    `;
  }

  return getProfileLocationSettings(false);
}

export async function createProfileLocationHour(input: ProfileLocationHourInput) {
  await ensureProfileTablesAvailable();
  const location = await getProfileLocationSettings(false);

  if (!location) {
    throw new ProfileValidationError("Pengaturan lokasi belum tersedia.");
  }

  const data = normalizeHourInput(input);
  await prisma.$executeRaw`
    INSERT INTO ult_profile_location_hours (
      LOCATION_ID,
      DAY_LABEL,
      TIME_LABEL,
      SORT_ORDER,
      IS_ACTIVE
    ) VALUES (
      ${BigInt(location.id)},
      ${data.dayLabel},
      ${data.timeLabel},
      ${data.sortOrder},
      ${data.isActive ? 1 : 0}
    )
  `;

  return getProfileLocationSettings(false);
}

export async function updateProfileLocationHour(
  id: string,
  input: ProfileLocationHourInput
) {
  assertValidId(id);
  await ensureProfileTablesAvailable();
  const data = normalizeHourInput(input);

  await prisma.$executeRaw`
    UPDATE ult_profile_location_hours
    SET
      DAY_LABEL = ${data.dayLabel},
      TIME_LABEL = ${data.timeLabel},
      SORT_ORDER = ${data.sortOrder},
      IS_ACTIVE = ${data.isActive ? 1 : 0},
      UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  return getProfileLocationSettings(false);
}

export async function deleteProfileLocationHour(id: string) {
  assertValidId(id);
  await ensureProfileTablesAvailable();

  await prisma.$executeRaw`
    DELETE FROM ult_profile_location_hours
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  return getProfileLocationSettings(false);
}

export async function getProfileImageRecord(
  type: "organization" | "location",
  id: string
) {
  assertValidId(id);

  if (type === "organization") {
    const node = await getProfileOrganizationNodeById(id);
    if (!node?.photoStoredName || !node.photoMimeType) return null;

    return {
      storedName: node.photoStoredName,
      mimeType: node.photoMimeType,
      isActive: node.isActive,
    };
  }

  const location = await getProfileLocationSettings(false);
  if (!location || location.id !== id || !location.imageStoredName || !location.imageMimeType) {
    return null;
  }

  return {
    storedName: location.imageStoredName,
    mimeType: location.imageMimeType,
    isActive: location.isActive,
  };
}

export function getProfileApiErrorStatus(error: unknown) {
  if (
    error instanceof ProfileValidationError ||
    error instanceof ProfileConflictError ||
    error instanceof ProfileTableUnavailableError
  ) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return null;
}
