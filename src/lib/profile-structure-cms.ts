import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";

export type ProfileStructureNodeType = "primary" | "standard" | "leaf";

export type ProfileStructureItem = {
  id: string;
  nodeId: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ProfileStructureNode = {
  id: string;
  parentId: string | null;
  label: string;
  nodeType: ProfileStructureNodeType;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  items: ProfileStructureItem[];
  children: ProfileStructureNode[];
};

export type ProfileStructureSettings = {
  id: string;
  title: string;
  subtitle: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ProfileStructureSettingsInput = {
  title: string;
  subtitle?: string | null;
  actor?: string | null;
};

export type ProfileStructureNodeInput = {
  parentId?: string | null;
  label: string;
  nodeType?: string | null;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

export type ProfileStructureItemInput = {
  nodeId: string;
  content: string;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

export type ProfileStructureItemUpdateInput = {
  content: string;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

type SettingsRecord = {
  ID: bigint | number | string;
  TITLE: string;
  SUBTITLE: string | null;
  UPDATED_AT: Date | string | null;
  UPDATED_BY: string | null;
};

type NodeRecord = {
  ID: bigint | number | string;
  PARENT_ID: bigint | number | string | null;
  LABEL: string;
  NODE_TYPE: string;
  SORT_ORDER: number;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

type ItemRecord = {
  ID: bigint | number | string;
  NODE_ID: bigint | number | string;
  CONTENT: string;
  SORT_ORDER: number;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

export class ProfileStructureValidationError extends Error {
  statusCode = 400;
}

export class ProfileStructureConflictError extends Error {
  statusCode = 409;
}

export class ProfileStructureTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Tabel CMS struktur profil belum tersedia. Jalankan migration 010_create_profile_structure_cms.sql."
    );
    this.name = "ProfileStructureTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new ProfileStructureValidationError("ID tidak valid.");
  }
}

function normalizeNodeType(value: string | null | undefined): ProfileStructureNodeType {
  if (value === "primary" || value === "leaf" || value === "standard") {
    return value;
  }
  return "standard";
}

function requiredLabel(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Label node wajib diisi.");
  }

  return trimmed.slice(0, 150);
}

function requiredTitle(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Judul section wajib diisi.");
  }

  return trimmed.slice(0, 150);
}

function optionalSubtitle(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 255) : null;
}

function requiredContent(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Isi baris wajib diisi.");
  }

  return trimmed.slice(0, 255);
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
    throw new ProfileStructureValidationError("Urutan harus berupa angka.");
  }

  return Math.trunc(numeric);
}

function optionalActor(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 100) : null;
}

function normalizeParentId(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || trimmed === "root" || trimmed === "none") {
    return null;
  }

  assertValidId(trimmed);
  return trimmed;
}

function isMissingProfileStructureTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    /ult_profile_structure_(settings|nodes|node_items)/.test(message) &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) console.warn(message, error);
    else console.warn(message);
  }
}

function handleReadError(error: unknown) {
  if (isMissingProfileStructureTableError(error)) {
    warnReadError(
      "Tabel CMS struktur profil belum tersedia. Jalankan migration 010_create_profile_structure_cms.sql."
    );
    return;
  }

  if (isDatabaseUnavailableError(error)) {
    warnReadError("Database CMS struktur profil sementara tidak tersedia.", error);
    return;
  }

  throw error;
}

async function hasProfileStructureTables() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (
          'ult_profile_structure_settings',
          'ult_profile_structure_nodes',
          'ult_profile_structure_node_items'
        )
    `;

    return Number(rows[0]?.tableCount ?? 0) === 3;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnReadError("Database CMS struktur profil sementara tidak tersedia.", error);
      return false;
    }

    throw error;
  }
}

async function ensureProfileStructureTablesAvailable() {
  if (!(await hasProfileStructureTables())) {
    throw new ProfileStructureTableUnavailableError();
  }
}

function toItem(record: ItemRecord): ProfileStructureItem {
  return {
    id: String(record.ID),
    nodeId: String(record.NODE_ID),
    content: record.CONTENT,
    sortOrder: Number(record.SORT_ORDER),
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
  };
}

function toNode(record: NodeRecord, items: ProfileStructureItem[]): ProfileStructureNode {
  return {
    id: String(record.ID),
    parentId: record.PARENT_ID === null ? null : String(record.PARENT_ID),
    label: record.LABEL,
    nodeType: normalizeNodeType(record.NODE_TYPE),
    sortOrder: Number(record.SORT_ORDER),
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
    items,
    children: [],
  };
}

function toSettings(record: SettingsRecord): ProfileStructureSettings {
  return {
    id: String(record.ID),
    title: record.TITLE,
    subtitle: record.SUBTITLE,
    updatedAt: toIso(record.UPDATED_AT),
    updatedBy: record.UPDATED_BY,
  };
}

function buildNodeTree(nodes: ProfileStructureNode[]) {
  const byId = new Map<string, ProfileStructureNode>();
  const roots: ProfileStructureNode[] = [];

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

  const sortTree = (items: ProfileStructureNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(roots);
  return roots;
}

async function getNodeRecords(activeOnly: boolean) {
  if (!(await hasProfileStructureTables())) {
    return [];
  }

  try {
    return activeOnly
      ? await prisma.$queryRaw<NodeRecord[]>`
          SELECT * FROM ult_profile_structure_nodes
          WHERE IS_ACTIVE = 1
          ORDER BY SORT_ORDER ASC, ID ASC
        `
      : await prisma.$queryRaw<NodeRecord[]>`
          SELECT * FROM ult_profile_structure_nodes
          ORDER BY SORT_ORDER ASC, ID ASC
        `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

async function getItemRecords(activeOnly: boolean) {
  if (!(await hasProfileStructureTables())) {
    return [];
  }

  try {
    return activeOnly
      ? await prisma.$queryRaw<ItemRecord[]>`
          SELECT * FROM ult_profile_structure_node_items
          WHERE IS_ACTIVE = 1
          ORDER BY SORT_ORDER ASC, ID ASC
        `
      : await prisma.$queryRaw<ItemRecord[]>`
          SELECT * FROM ult_profile_structure_node_items
          ORDER BY SORT_ORDER ASC, ID ASC
        `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

async function getNodesWithItems(activeOnly: boolean) {
  const [nodeRecords, itemRecords] = await Promise.all([
    getNodeRecords(activeOnly),
    getItemRecords(activeOnly),
  ]);

  const itemsByNodeId = new Map<string, ProfileStructureItem[]>();
  itemRecords.forEach((record) => {
    const item = toItem(record);
    const list = itemsByNodeId.get(item.nodeId) ?? [];
    list.push(item);
    itemsByNodeId.set(item.nodeId, list);
  });

  return nodeRecords.map((record) =>
    toNode(record, itemsByNodeId.get(String(record.ID)) ?? [])
  );
}

async function getSettingsRecord() {
  if (!(await hasProfileStructureTables())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<SettingsRecord[]>`
      SELECT * FROM ult_profile_structure_settings ORDER BY ID ASC LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function getPublicProfileStructure() {
  const [settingsRecord, nodes] = await Promise.all([
    getSettingsRecord(),
    getNodesWithItems(true),
  ]);

  // Public tree must not surface active nodes whose parent is inactive
  // (or missing) as false roots, so filter to only nodes whose entire
  // ancestor chain is active before building the tree.
  const activeIds = new Set(nodes.map((node) => node.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));

  function isChainActive(node: ProfileStructureNode): boolean {
    if (!node.parentId) return true;
    if (!activeIds.has(node.parentId)) return false;
    const parent = byId.get(node.parentId);
    return parent ? isChainActive(parent) : false;
  }

  const visibleNodes = nodes.filter((node) => isChainActive(node));

  return {
    settings: settingsRecord ? toSettings(settingsRecord) : null,
    tree: buildNodeTree(visibleNodes),
  };
}

export async function getAdminProfileStructureState() {
  const tableAvailable = await hasProfileStructureTables();

  if (!tableAvailable) {
    return { settings: null, nodes: [], tree: [], unavailable: true };
  }

  const [settingsRecord, nodes] = await Promise.all([
    getSettingsRecord(),
    getNodesWithItems(false),
  ]);

  return {
    settings: settingsRecord ? toSettings(settingsRecord) : null,
    nodes,
    tree: buildNodeTree(nodes),
    unavailable: false,
  };
}

export async function updateProfileStructureSettings(input: ProfileStructureSettingsInput) {
  await ensureProfileStructureTablesAvailable();

  const title = requiredTitle(input.title);
  const subtitle = optionalSubtitle(input.subtitle);
  const actor = optionalActor(input.actor);
  const existing = await getSettingsRecord();

  if (!existing) {
    await prisma.$executeRaw`
      INSERT INTO ult_profile_structure_settings (ID, TITLE, SUBTITLE, UPDATED_BY)
      VALUES (1, ${title}, ${subtitle}, ${actor})
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE ult_profile_structure_settings
      SET TITLE = ${title}, SUBTITLE = ${subtitle}, UPDATED_BY = ${actor}, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(existing.ID as string)}
      LIMIT 1
    `;
  }

  const updated = await getSettingsRecord();
  return updated ? toSettings(updated) : null;
}

export async function getProfileStructureNodeById(id: string) {
  assertValidId(id);

  if (!(await hasProfileStructureTables())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<NodeRecord[]>`
      SELECT * FROM ult_profile_structure_nodes WHERE ID = ${BigInt(id)} LIMIT 1
    `;

    if (!rows[0]) return null;

    const items = await prisma.$queryRaw<ItemRecord[]>`
      SELECT * FROM ult_profile_structure_node_items
      WHERE NODE_ID = ${BigInt(id)}
      ORDER BY SORT_ORDER ASC, ID ASC
    `;

    return toNode(rows[0], items.map(toItem));
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

async function assertParentIsValid(parentId: string | null, selfId?: string) {
  if (!parentId) return;

  if (selfId && parentId === selfId) {
    throw new ProfileStructureConflictError("Node tidak bisa menjadi atasan dirinya sendiri.");
  }

  const parent = await getProfileStructureNodeById(parentId);
  if (!parent) {
    throw new ProfileStructureValidationError("Atasan (parent) tidak ditemukan.");
  }

  if (!selfId) return;

  let currentParentId = parent.parentId;
  while (currentParentId) {
    if (currentParentId === selfId) {
      throw new ProfileStructureConflictError(
        "Perubahan ini akan membuat struktur melingkar (circular hierarchy)."
      );
    }

    const currentParent = await getProfileStructureNodeById(currentParentId);
    currentParentId = currentParent?.parentId ?? null;
  }
}

function normalizeNodeInput(input: ProfileStructureNodeInput) {
  return {
    parentId: normalizeParentId(input.parentId),
    label: requiredLabel(input.label),
    nodeType: normalizeNodeType(input.nodeType),
    sortOrder: normalizeSortOrder(input.sortOrder),
    isActive: normalizeBoolean(input.isActive, true),
    actor: optionalActor(input.actor),
  };
}

export async function createProfileStructureNode(input: ProfileStructureNodeInput) {
  await ensureProfileStructureTablesAvailable();
  const data = normalizeNodeInput(input);
  await assertParentIsValid(data.parentId);

  await prisma.$executeRaw`
    INSERT INTO ult_profile_structure_nodes (
      PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, IS_ACTIVE, CREATED_BY
    ) VALUES (
      ${data.parentId ? BigInt(data.parentId) : null},
      ${data.label},
      ${data.nodeType},
      ${data.sortOrder},
      ${data.isActive ? 1 : 0},
      ${data.actor}
    )
  `;

  const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
    SELECT ID FROM ult_profile_structure_nodes ORDER BY ID DESC LIMIT 1
  `;

  return rows[0] ? getProfileStructureNodeById(String(rows[0].ID)) : null;
}

export async function updateProfileStructureNode(id: string, input: ProfileStructureNodeInput) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getProfileStructureNodeById(id);
  if (!existing) {
    return null;
  }

  const data = normalizeNodeInput(input);
  await assertParentIsValid(data.parentId, id);

  await prisma.$executeRaw`
    UPDATE ult_profile_structure_nodes
    SET
      PARENT_ID = ${data.parentId ? BigInt(data.parentId) : null},
      LABEL = ${data.label},
      NODE_TYPE = ${data.nodeType},
      SORT_ORDER = ${data.sortOrder},
      IS_ACTIVE = ${data.isActive ? 1 : 0},
      UPDATED_BY = ${data.actor},
      UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  return getProfileStructureNodeById(id);
}

export async function deleteProfileStructureNode(id: string, options?: { cascade?: boolean }) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getProfileStructureNodeById(id);
  if (!existing) {
    return false;
  }

  const childRows = await prisma.$queryRaw<Array<{ childCount: bigint | number }>>`
    SELECT COUNT(*) AS childCount FROM ult_profile_structure_nodes WHERE PARENT_ID = ${BigInt(id)}
  `;
  const childCount = Number(childRows[0]?.childCount ?? 0);

  if (childCount > 0 && !options?.cascade) {
    throw new ProfileStructureConflictError(
      `Node ini masih memiliki ${childCount} node turunan. Pindahkan atau hapus turunannya terlebih dahulu, atau gunakan hapus beserta turunan.`
    );
  }

  if (childCount > 0 && options?.cascade) {
    async function collectDescendantIds(nodeId: string): Promise<string[]> {
      const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
        SELECT ID FROM ult_profile_structure_nodes WHERE PARENT_ID = ${BigInt(nodeId)}
      `;
      const directChildIds = rows.map((row) => String(row.ID));
      const nested = await Promise.all(directChildIds.map(collectDescendantIds));
      return [...directChildIds, ...nested.flat()];
    }

    const descendantIds = await collectDescendantIds(id);

    // Delete deepest-first so FK RESTRICT on PARENT_ID never blocks a delete.
    for (const descendantId of descendantIds.reverse()) {
      await prisma.$executeRaw`DELETE FROM ult_profile_structure_nodes WHERE ID = ${BigInt(descendantId)} LIMIT 1`;
    }
  }

  await prisma.$executeRaw`DELETE FROM ult_profile_structure_nodes WHERE ID = ${BigInt(id)} LIMIT 1`;
  return true;
}

export async function createProfileStructureItem(input: ProfileStructureItemInput) {
  await ensureProfileStructureTablesAvailable();
  assertValidId(input.nodeId);

  const node = await getProfileStructureNodeById(input.nodeId);
  if (!node) {
    throw new ProfileStructureValidationError("Node tidak ditemukan.");
  }

  const content = requiredContent(input.content);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = normalizeBoolean(input.isActive, true);
  const actor = optionalActor(input.actor);

  await prisma.$executeRaw`
    INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, IS_ACTIVE, CREATED_BY)
    VALUES (${BigInt(input.nodeId)}, ${content}, ${sortOrder}, ${isActive ? 1 : 0}, ${actor})
  `;

  return getProfileStructureNodeById(input.nodeId);
}

async function getItemById(id: string) {
  assertValidId(id);

  const rows = await prisma.$queryRaw<ItemRecord[]>`
    SELECT * FROM ult_profile_structure_node_items WHERE ID = ${BigInt(id)} LIMIT 1
  `;

  return rows[0] ? toItem(rows[0]) : null;
}

export async function updateProfileStructureItem(id: string, input: ProfileStructureItemUpdateInput) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getItemById(id);
  if (!existing) {
    return null;
  }

  const content = requiredContent(input.content);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = normalizeBoolean(input.isActive, existing.isActive);
  const actor = optionalActor(input.actor);

  await prisma.$executeRaw`
    UPDATE ult_profile_structure_node_items
    SET CONTENT = ${content}, SORT_ORDER = ${sortOrder}, IS_ACTIVE = ${isActive ? 1 : 0},
      UPDATED_BY = ${actor}, UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  return getProfileStructureNodeById(existing.nodeId);
}

export async function deleteProfileStructureItem(id: string) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getItemById(id);
  if (!existing) {
    return false;
  }

  await prisma.$executeRaw`DELETE FROM ult_profile_structure_node_items WHERE ID = ${BigInt(id)} LIMIT 1`;
  return true;
}

export function getProfileStructureApiErrorStatus(error: unknown) {
  if (
    error instanceof ProfileStructureValidationError ||
    error instanceof ProfileStructureConflictError ||
    error instanceof ProfileStructureTableUnavailableError
  ) {
    return { message: error.message, statusCode: error.statusCode };
  }

  return null;
}
